/**
 * PlayerController class to handle human player behavior
 */
export default class PlayerController {
    /**
     * Creates a new instance of PlayerController
     * @param {Phaser.Scene} scene - The scene instance containing the player
     */
    constructor(scene) {
        this.scene = scene;
        this.player = null; // Initialize as null, will be set in init()
        this.isSwinging = false;
        this.swingCooldown = false;
    }

    /**
     * Initializes the player controller
     */
    init() {
        // Set the player reference here after it has been created
        this.player = this.scene.player1;
        // No need to create swing hitbox here as it's already created in MainScene
    }

    /**
     * Updates player behavior - called every frame
     * @param {Phaser.Input.Keyboard.CursorKeys} cursors - Keyboard cursor keys
     */
    update(cursors) {
        // Always get the latest player reference from the scene
        this.player = this.scene.player1;
        
        // Check if player exists before trying to access its properties
        if (!this.player || !this.player.body) {
            return; // Skip update if player or player.body is not available
        }
        
        // Handle player movement using Player class's moveHorizontal method
        // This will update the facing direction and direction indicator
        if (cursors.left.isDown) {
            this.scene.player1Manager.moveHorizontal(-1); // Move left
        } else if (cursors.right.isDown) {
            this.scene.player1Manager.moveHorizontal(1); // Move right
        } else {
            this.scene.player1Manager.moveHorizontal(0); // Stop
        }

        // Reset jump count when touching ground
        if (this.player.body.touching.down) {
            this.scene.jumpCount1 = 0;
            this.scene.canJump1 = true;
        }

        // Handle jumping
        if (cursors.up.isDown && this.scene.canJump1 && this.scene.jumpCount1 < 2) {
            this.player.body.setVelocityY(this.scene.JUMP_VELOCITY);
            this.scene.canJump1 = false;
            this.scene.jumpCount1++;
        }

        if (cursors.up.isUp) {
            this.scene.canJump1 = true;
        }

        // Handle swinging - explicitly use player1Manager to avoid affecting player2
        if (cursors.down.isDown && !this.scene.player1Manager.swingCooldown) {
            // Call player1Manager's startSwing directly instead of using scene.startSwing
            this.scene.player1Manager.startSwing();
        }
    }
}