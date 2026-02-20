import * as THREE from "https://esm.sh/three@0.160.0";

// Interner State
let currentAvatar = null;
let isFirstPerson = false;
let savedCameraState = { pos: new THREE.Vector3(), target: new THREE.Vector3() };

// Design-Konstanten
const DESIGN = { 
    color: 0x00aaff, // Cyan Körper (schematische Darstellung)
    headColor: 0xffffff, // Weißer Kopf
};

// === Getters ===

export function isFirstPersonActive() {
    return isFirstPerson;
}

export function getCurrentAvatar() {
    return currentAvatar;
}

// === Main Functions ===

/**
 * Erstellt oder löscht den Avatar in der Szene.
 * Händelt auch das Entfernen aus den Verwaltungs-Arrays.
 * 
 * @param {THREE.Scene} scene 
 * @param {Array} movableObjects - Referenz auf das Array in script.js
 * @param {Array} interactionMeshes - Referenz auf das Array in script.js
 * @returns {THREE.Group|null} Das Avatar-Objekt oder null, wenn entfernt.
 */
export function toggleAvatar(scene, movableObjects, interactionMeshes) {
    // 1. Entfernen, falls bereits vorhanden
    if (currentAvatar) {
        scene.remove(currentAvatar);
        
        // Aus movableObjects entfernen
        let idx = movableObjects.indexOf(currentAvatar);
        if (idx > -1) movableObjects.splice(idx, 1);
        
        // Hitbox aus interactionMeshes entfernen
        if (currentAvatar.children) {
            const hitbox = currentAvatar.children.find(c => c.userData.isHitbox);
            if(hitbox) {
                const hIdx = interactionMeshes.indexOf(hitbox);
                if (hIdx > -1) interactionMeshes.splice(hIdx, 1);
            }
        }

        // Speicher bereinigen (Geometrien/Materialien)
        currentAvatar.traverse(c => {
            if(c.geometry) c.geometry.dispose();
            if(c.material) {
                if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                else c.material.dispose();
            }
        });

        currentAvatar = null;
        isFirstPerson = false; // Reset Status
        return null;
    }

    // 2. Neu erstellen
    const group = new THREE.Group();
    const visualGroup = new THREE.Group(); // Gruppe für sichtbare Teile (wird in FP ausgeblendet)

    const matBody = new THREE.MeshStandardMaterial({ color: DESIGN.color, roughness: 0.4 });
    const matHead = new THREE.MeshStandardMaterial({ color: DESIGN.headColor, roughness: 0.2 });

    // --- Geometrie Aufbau ---
    
    // Unterkörper (Zylinder)
    const torsoLower = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.17, 1.0, 32), matBody);
    torsoLower.position.y = 0.5 + 0.05; 
    torsoLower.castShadow = true;
    torsoLower.receiveShadow = true;
    visualGroup.add(torsoLower);

    // Oberkörper (Breiterer Zylinder)
    const torsoUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.19, 0.7, 32), matBody);
    torsoUpper.position.y = 1.0 + 0.35; 
    torsoUpper.castShadow = true;
    torsoUpper.receiveShadow = true;
    visualGroup.add(torsoUpper);

    // Hals
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.15, 32), matBody);
    neck.position.y = 1.70; 
    visualGroup.add(neck);

    // Kopf (Sphäre)
    const headGeo = new THREE.SphereGeometry(0.21, 32, 32);
    headGeo.scale(0.92, 1.18, 1.0); 
    const head = new THREE.Mesh(headGeo, matHead);
    head.position.y = 1.90; 
    head.castShadow = true;
    visualGroup.add(head);

    // Nase (WICHTIG für Orientierung in der Draufsicht)
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.15), matBody);
    nose.position.set(0, 1.90, 0.22); // Vorne am Gesicht
    visualGroup.add(nose);

    group.add(visualGroup);

    // --- Hitbox (Unsichtbar für Klick-Erkennung) ---
    // Etwas breiter als der Körper, damit man ihn gut anklicken kann
    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 2.2, 0.8), 
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = 1.1;
    hitbox.userData = { root: group, isHitbox: true }; // Verweis auf Root für Raycaster
    group.add(hitbox);

    // --- Metadaten ---
    group.position.set(0, 0, 0); 
    // Drehung um 180 Grad (Pi), damit die Ich-Perspektive sofort nach vorne zur Tafel blickt
    group.rotation.y = Math.PI; 
    group.userData = { 
        typeId: 'avatar_procedural', 
        isAvatar: true, 
        annotation: "Lernender (Simulation)", 
        visualRef: visualGroup // Referenz speichern zum Ausblenden in FP
    };
    
    // Zur Szene hinzufügen
    scene.add(group);
    movableObjects.push(group);
    interactionMeshes.push(hitbox);

    currentAvatar = group;
    return group;
}

/**
 * Schaltet zwischen Ich-Perspektive und normaler Ansicht um.
 * Positioniert die Kamera und speichert den alten Status.
 * * FIX: Passt die OrbitControls-Winkel an, damit man in der 
 * Ich-Perspektive auch nach oben schauen kann (Tafel/Decke).
 * * @param {THREE.Camera} camera 
 * @param {THREE.OrbitControls} controls 
 */
export function toggleAvatarView(camera, controls) {
    if (!currentAvatar) { 
        console.warn("Versuch, Avatar-Ansicht zu toggeln ohne Avatar.");
        return; 
    }

    const visualGroup = currentAvatar.userData.visualRef;

    if (!isFirstPerson) {
        // === AKTIVIEREN (First Person) ===
        isFirstPerson = true;

        // Alten Kamerastatus speichern
        savedCameraState.pos.copy(camera.position);
        savedCameraState.target.copy(controls.target);

        // Avatar unsichtbar machen
        if(visualGroup) visualGroup.visible = false;

        // Kamera auf Augenhöhe setzen
        const eyePos = currentAvatar.position.clone();
        eyePos.y += 1.80; // Augenhöhe
        camera.position.copy(eyePos);

        // Blickrichtung setzen
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(currentAvatar.quaternion);
        const targetPos = eyePos.clone().add(forward);
        controls.target.copy(targetPos);
        
        // FIX: Winkel-Limitierung aufheben, damit man nach OBEN schauen kann
        // Standard ist PI/2 (90°), wir erlauben jetzt fast PI (180°)
        controls.maxPolarAngle = Math.PI - 0.1; 
        
        controls.update();

    } else {
        // === DEAKTIVIEREN (Third Person) ===
        isFirstPerson = false;

        // Avatar wieder sichtbar
        if(visualGroup) visualGroup.visible = true;

        // Kamera zurücksetzen
        camera.position.copy(savedCameraState.pos);
        controls.target.copy(savedCameraState.target);
        
        // FIX: Winkel-Limitierung wiederherstellen (nicht unter den Boden schauen)
        controls.maxPolarAngle = Math.PI / 2 - 0.05;

        controls.update();
    }
}