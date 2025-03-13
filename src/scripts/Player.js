/**
 * Player class to handle player creation and physics
 */
export default class Player {
    /**
     * Creates a new instance of Player
     * @param {Phaser.Scene} scene - The scene instance containing the player
     */
    constructor(scene) {
        this.scene = scene;
        this.player = null;
        this.swingHitbox = null;
        this.isSwinging = false;
        this.swingCooldown = false;
        this.facingRight = true;
        this.directionIndicator = null;
    }

    /**
     * Creates and initializes a player
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     * @param {number} width - Player width
     * @param {number} height - Player height
     * @param {number} color - Player color
     * @param {boolean} isPlayer1 - Whether this is player 1 (human player)
     */
    create(x, y, width, height, color, isPlayer1) {
        // Create the player rectangle
        this.player = this.scene.add.rectangle(x, y, width, height, color);
        this.scene.physics.add.existing(this.player);
        this.player.setDepth(2);
        
        // Create direction indicator triangle as a separate object
        const triangleSize = width * 0.6;
        const triangleOffset = width / 2 + 5;
        
        // Create triangle pointing right (default direction)
        this.directionIndicator = this.scene.add.triangle(
            x + triangleOffset, y, // position based on player position
            0, -triangleSize/2, // point 1
            triangleSize, 0,    // point 2
            0, triangleSize/2,  // point 3
            isPlayer1 ? 0x00ff00 : 0x0000ff // Match player color
        );
        this.directionIndicator.setDepth(2);
        
        // Create the swing hitbox initially (but invisible)
        const hitboxWidth = 100;
        const hitboxHeight = 200;
        this.swingHitbox = this.scene.add.rectangle(
            x + width/2 + hitboxWidth/2, // Default to right side
            y,
            hitboxWidth,
            hitboxHeight,
            0xff0000,
            0.5 // Semi-transparent for debug visibility
        );
        this.scene.physics.add.existing(this.swingHitbox);
        this.swingHitbox.body.allowGravity = false;
        this.swingHitbox.setVisible(false); // Initially invisible
        
        // Set player properties
        this.player.body.setCollideWorldBounds(true);
        this.isPlayer1 = isPlayer1;
        this.facingRight = true; // Default facing direction
        
        // Create swing hitbox if this is the first player created
        if (!this.scene.swingHitbox) {
            this.createSwingHitbox();
        }
        
        // Store player reference in scene for compatibility with existing code
        if (isPlayer1) {
            this.scene.player1 = this.player;
            this.scene.jumpCount1 = 0;
            this.scene.canJump1 = true;
        } else {
            this.scene.player2 = this.player;
            this.scene.jumpCount2 = 0;
            this.scene.canJump2 = true;
        }
        
        // Debug log
        console.log(`Created player at ${x},${y} visible:${this.player.visible}`);
        return this.player;
    }
    
    /**
     * Creates the swing hitbox for hitting the ball
     */
    createSwingHitbox() {
        const radius = 100;
        
        // Create the visual semicircle using arc
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, 0x000000, 1); // Add border
        graphics.fillStyle(0xff0000, 0.7);
        graphics.beginPath();
        graphics.arc(0, 0, radius, -Math.PI/2, Math.PI/2, false);
        graphics.lineTo(0, 0);
        graphics.closePath();
        graphics.fill();
        graphics.stroke();
        
        // Create hitbox for collision detection
        this.swingHitbox = this.scene.add.arc(0, 0, radius, 270, 90, false, 0xff0000, 0);
        this.scene.physics.add.existing(this.swingHitbox, false);
        
        // Set initial properties
        this.swingHitbox.visible = false;
        this.swingHitbox.active = false;
        this.swingHitbox.radius = radius;
        
        // Store graphics reference
        this.swingHitbox.graphics = graphics;
        graphics.visible = false;
    }

    startSwing() {
        if (this.swingCooldown) return;
        
        this.isSwinging = true;
        
        // Position the hitbox based on facing direction
        const hitboxWidth = 100;
        const hitboxOffsetX = this.facingRight ? 
            this.player.width/2 + hitboxWidth/2 : 
            -this.player.width/2 - hitboxWidth/2;
        
        // Update position and make visible
        this.swingHitbox.x = this.player.x + hitboxOffsetX;
        this.swingHitbox.y = this.player.y;
        this.swingHitbox.setVisible(true);
        
        console.log(`Player ${this.isPlayer1 ? '1' : '2'} swing hitbox at ${this.swingHitbox.x}, ${this.swingHitbox.y}`);
        
        // Set swing cooldown
        this.swingCooldown = true;
        
        // End swing after duration
        this.scene.time.delayedCall(this.scene.swingDuration, () => {
            this.isSwinging = false;
            this.swingHitbox.setVisible(false);
            
            // Reset cooldown after a short delay
            this.scene.time.delayedCall(300, () => {
                this.swingCooldown = false;
            });
        });
    }

    endSwing() {
        this.isSwinging = false;
        this.swingHitbox.visible = false;
        this.swingHitbox.active = false;
        this.swingHitbox.graphics.visible = false;
        
        // Stop the update event when the swing ends
        if (this.swingUpdateEvent) {
            this.swingUpdateEvent.remove();
            this.swingUpdateEvent = null;
        }
    }

    updateSwingHitboxPosition() {
        // Use stored facing direction instead of velocity
        const facingRight = this.facingDirection > 0;
        
        // Position the hitbox to the right or left of the player based on facing direction
        if (facingRight) {
            // Position to the right of the player
            this.swingHitbox.x = this.player.x + this.player.width/2;
            this.swingHitbox.graphics.x = this.swingHitbox.x;
            // Set arc angles for right-facing (270 to 90 degrees)
            this.swingHitbox.startAngle = 270;
            this.swingHitbox.endAngle = 90;
            // Update graphics for visual representation
            this.swingHitbox.graphics.clear();
            this.swingHitbox.graphics.lineStyle(2, 0x000000, 1);
            this.swingHitbox.graphics.fillStyle(0xff0000, 0.7);
            this.swingHitbox.graphics.beginPath();
            this.swingHitbox.graphics.arc(0, 0, this.swingHitbox.radius, -Math.PI/2, Math.PI/2, false);
            this.swingHitbox.graphics.lineTo(0, 0);
            this.swingHitbox.graphics.closePath();
            this.swingHitbox.graphics.fill();
            this.swingHitbox.graphics.stroke();
        } else {
            // Position to the left of the player
            this.swingHitbox.x = this.player.x - this.player.width/2;
            this.swingHitbox.graphics.x = this.swingHitbox.x;
            // Set arc angles for left-facing (90 to 270 degrees)
            this.swingHitbox.startAngle = 90;
            this.swingHitbox.endAngle = 270;
            // Update graphics for visual representation
            this.swingHitbox.graphics.clear();
            this.swingHitbox.graphics.lineStyle(2, 0x000000, 1);
            this.swingHitbox.graphics.fillStyle(0xff0000, 0.7);
            this.swingHitbox.graphics.beginPath();
            this.swingHitbox.graphics.arc(0, 0, this.swingHitbox.radius, Math.PI/2, -Math.PI/2, false);
            this.swingHitbox.graphics.lineTo(0, 0);
            this.swingHitbox.graphics.closePath();
            this.swingHitbox.graphics.fill();
            this.swingHitbox.graphics.stroke();
        }
        
        // Center vertically with the player
        this.swingHitbox.y = this.player.y;
        this.swingHitbox.graphics.y = this.swingHitbox.y;
        
        // Update direction indicator (face) position
        // Position the triangle directly adjacent to the player with a smaller offset
        const triangleOffset = 2; // Reduced offset to position triangle closer to the player
        
        // Update triangle position and rotation
        if (facingRight) {
            this.directionIndicator.setPosition(
                this.player.x + (this.player.width/2) + triangleOffset,
                this.player.y
            );
            this.directionIndicator.setRotation(0); // Face right
        } else {
            this.directionIndicator.setPosition(
                this.player.x - (this.player.width/2) - triangleOffset,
                this.player.y
            );
            this.directionIndicator.setRotation(Math.PI); // Face left
        }
    }

    /**
     * Moves the player horizontally
     * @param {number} direction - Direction to move (-1 for left, 1 for right, 0 for stop)
     */
    // Add this method to update the direction indicator when player changes direction
    updateDirection(facingRight) {
        if (this.facingRight !== facingRight) {
            this.facingRight = facingRight;
        }
    }

    // Add this to your update method or call it from the scene's update
    updateIndicatorPosition() {
        if (!this.player || !this.directionIndicator) return;
        
        const offset = this.player.width / 2 + 5;
        const xOffset = this.facingRight ? offset : -offset;
        
        this.directionIndicator.x = this.player.x + xOffset;
        this.directionIndicator.y = this.player.y;
        this.directionIndicator.scaleX = this.facingRight ? 1 : -1;
    }

    // Modify moveHorizontal to update direction
    moveHorizontal(direction) {
        if (direction < 0) {
            this.player.body.setVelocityX(-this.scene.PLAYER_SPEED);
            this.updateDirection(false); // Facing left
        } else if (direction > 0) {
            this.player.body.setVelocityX(this.scene.PLAYER_SPEED);
            this.updateDirection(true); // Facing right
        } else {
            this.player.body.setVelocityX(0);
        }
        
        // Update indicator position immediately
        this.updateIndicatorPosition();
    }

    /**
     * Makes the player jump if allowed
     * @param {boolean} isPlayer1 - Whether this is player 1 (human player)
     */
    jump(isPlayer1 = true) {
        const jumpCount = isPlayer1 ? this.scene.jumpCount1 : this.scene.jumpCount2;
        const canJump = isPlayer1 ? this.scene.canJump1 : this.scene.canJump2;
        
        if (canJump && jumpCount < 2) {
            this.player.body.setVelocityY(this.scene.JUMP_VELOCITY);
            
            if (isPlayer1) {
                this.scene.canJump1 = false;
                this.scene.jumpCount1++;
            } else {
                this.scene.canJump2 = false;
                this.scene.jumpCount2++;
            }
        }
    }

    /**
     * Resets jump ability when player touches the ground
     * @param {boolean} isPlayer1 - Whether this is player 1 (human player)
     */
    resetJumpOnGround(isPlayer1 = true) {
        if (this.player.body.touching.down) {
            if (isPlayer1) {
                this.scene.jumpCount1 = 0;
                this.scene.canJump1 = true;
            } else {
                this.scene.jumpCount2 = 0;
                this.scene.canJump2 = true;
            }
        }
    }
}