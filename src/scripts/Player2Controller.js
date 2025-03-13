/**
 * Player2Controller class to handle second human player behavior using WASD controls
 */
import Phaser from 'phaser';

export default class Player2Controller {
    /**
     * Creates a new instance of Player2Controller
     * @param {Phaser.Scene} scene - The scene instance containing the player
     */
    constructor(scene) {
        this.scene = scene;
        this.player = null; // Initialize as null, will be set in init()
        this.isSwinging = false;
        this.swingCooldown = false;
        this.keys = null; // Will hold WASD key objects
    }

    /**
     * Initializes the player controller
     */
    init() {
        // Set the player reference here after it has been created
        this.player = this.scene.player2;
        // Set up WASD controls
        this.keys = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    /**
     * Updates player behavior - called every frame
     */
    update() {
        // Always get the latest player reference from the scene
        this.player = this.scene.player2;
        
        // Check if player exists before trying to access its properties
        if (!this.player || !this.player.body) {
            console.log("Player 2 or its body is not available");
            return; // Skip update if player or player.body is not available
        }
        
        // Add debug logging to verify key presses
        if (this.keys.left.isDown || this.keys.right.isDown || this.keys.up.isDown) {
            console.log("Player 2 keys pressed:", 
                this.keys.left.isDown ? "LEFT" : "", 
                this.keys.right.isDown ? "RIGHT" : "",
                this.keys.up.isDown ? "UP" : "");
        }
        
        // Rest of the update method remains the same
        // Handle player movement using Player class's moveHorizontal method
        if (this.keys.left.isDown) {
            this.scene.player2Manager.moveHorizontal(-1); // Move left
        } else if (this.keys.right.isDown) {
            this.scene.player2Manager.moveHorizontal(1); // Move right
        } else {
            this.scene.player2Manager.moveHorizontal(0); // Stop
        }

        // Reset jump count when touching ground
        if (this.player.body.touching.down) {
            this.scene.jumpCount2 = 0;
            this.scene.canJump2 = true;
        }

        // Handle jumping
        if (this.keys.up.isDown && this.scene.canJump2 && this.scene.jumpCount2 < 2) {
            this.player.body.setVelocityY(this.scene.JUMP_VELOCITY);
            this.scene.canJump2 = false;
            this.scene.jumpCount2++;
        }

        if (this.keys.up.isUp) {
            this.scene.canJump2 = true;
        }

        // Handle swinging - explicitly use player2Manager to avoid affecting player1
        if (this.keys.down.isDown && !this.scene.player2Manager.swingCooldown) {
            this.scene.player2Manager.startSwing();
        }
    }
}