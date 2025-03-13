import Phaser from 'phaser';
import DebugUtils from '../scripts/DebugUtils';
import GameManager from '../scripts/GameManager';
import PlayerController from '../scripts/PlayerController';
import Player2Controller from '../scripts/Player2Controller';
import Ball from '../scripts/Ball';
import Player from '../scripts/Player';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene', active: true });  // Add explicit scene activation
        this.ball = null;
        this.player1 = null;
        this.player2 = null;
        this.PLAYER_SPEED = 800;
        this.JUMP_VELOCITY = -900;
        this.cursors = null;
        this.canJump1 = true;
        this.canJump2 = true;
        this.jumpCount1 = 0;
        this.jumpCount2 = 0;
        this.isSwinging = false;
        this.swingDuration = 300;
        this.swingCooldown = false;
        this.isHitStopped = false;
        this.gameStarted = false;
        this.isAIEnabled = false;
        this.aiDifficultyLevel = 0.7; // Keeping this for compatibility but it won't be used
        this.HIT_STOP_THRESHOLD = 1000; // Define threshold for hit stop effect
        this.BASE_HIT_STOP_DURATION = 100; // Define base duration for hit stop
        this.hitStopCount = 0; // Initialize hit stop counter
        this.BALL_SPEED = 500; // Define base ball speed for speed meter
        this.swingHitbox = null; // Initialize swingHitbox to null
    }

    preload() {
        // No need to create circle in preload
    }

    create() {
        // Set scene background FIRST
        this.cameras.main.setBackgroundColor('#D253FC');
        
        // Initialize debug utils
        this.debugUtils = new DebugUtils(this);
        
        // Add temporary debug text to verify scene creation
        this.add.text(100, 100, 'Scene Active', { 
            fontSize: '48px', 
            fill: '#ffffff' 
        }).setDepth(1000);
        
        // Add camera debug view first
        this.cameras.main.setBackgroundColor('#27162c');
        this.cameras.main.setRoundPixels(true);
        this.cameras.main.fadeIn(100);
        
        // Explicitly set camera bounds
        this.cameras.main.setBounds(0, 0, 1920, 1080);
        this.cameras.main.setZoom(1);  // Ensure no accidental zoom
        this.cameras.main.centerOn(960, 540);  // Center camera on play area

        // Camera bounds visualization removed as it's not necessary for gameplay
        
        // Create ALL game objects AFTER camera setup
        // Keep the purple background from main.js
        // this.cameras.main.setBackgroundColor('#333333');

        // Initialize debug utils but don't create debug elements
        this.debugUtils = new DebugUtils(this);
        this.gameManager = new GameManager(this);
        this.gameManager.init();
        
        // Create PlayerController instances
        this.playerController = new PlayerController(this);
        this.player2Controller = new Player2Controller(this);
        
        // Initialize player controllers after player creation
        this.playerController.init();
        this.player2Controller.init();
        
        // Create mouse position indicator fixed at bottom right
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        this.mousePositionText = this.add.text(1400, 1000, 'X: 0, Y: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.mousePositionText.setDepth(1000); // Ensure it's always on top
        
        // Add mouse move event listener
        this.input.on('pointermove', (pointer) => {
            this.mousePositionText.setText(`X: ${Math.round(pointer.x)}, Y: ${Math.round(pointer.y)}`);
        });

        // Create players using Player class
        this.player1Manager = new Player(this);
        this.player1 = this.player1Manager.create(400, 500, 50, 200, 0x00ff00, true);
        
        // Create player 2
        this.player2Manager = new Player(this);
        this.player2 = this.player2Manager.create(1520, 500, 50, 200, 0x0000ff, false);
        this.playerObj = this.player1Manager; // Reference for PlayerController
    
        // Create PlayerController instances AFTER player creation
        this.playerController = new PlayerController(this);
        this.player2Controller = new Player2Controller(this);
    
        // Initialize player controllers after player creation
        this.playerController.init();
        this.player2Controller.init();
        
        // Create the ball using Ball class - moved after player creation
        this.ballManager = new Ball(this);
        this.ball = this.ballManager.create(900, 600, 10, 0xffffff);
        
        // Set gameStarted to true but don't move the ball yet
        // The ball will only move after the first hit
        this.gameStarted = true;
        
        // Create ground collision detection
        const ground = this.add.rectangle(960, 900, 1920, 60, 0xFFFF00);
        this.physics.add.existing(ground, true);
        ground.setVisible(true);
        ground.setDepth(0);
        ground.setAlpha(1);
        
        // Add colliders first
        this.physics.add.collider(this.player1, ground);
        this.physics.add.collider(this.player2, ground);
        this.physics.add.collider(this.ball, ground);
        
        // Create debug graphics with lower depth
        const debugGraphics = this.physics.world.createDebugGraphic();
        debugGraphics.setDepth(3);  // Set debug to higher depth
        debugGraphics.setAlpha(0.5);  // Make debug graphics semi-transparent
        
        // Ensure game objects are above ground but below debug
        this.player1.setDepth(2);
        this.player2.setDepth(2);
        this.ball.setDepth(2);

        // Set up keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Set player1 as the human player
        this.player = this.player1;
        
        // Add collision detection between ball and each player's swing hitbox
        this.physics.add.overlap(this.ball, this.player1Manager.swingHitbox, this.handleBallHit, null, this);
        this.physics.add.overlap(this.ball, this.player2Manager.swingHitbox, this.handleBallHit, null, this);
        
        // Add player controls info text
        this.createControlsInfoText();
        
        // Add keyboard event listeners for player swings
        this.input.keyboard.on('keydown-DOWN', () => {
            console.log("Player 1 swing triggered");
            this.player1Manager.startSwing();
        });
        
        this.input.keyboard.on('keydown-S', () => {
            console.log("Player 2 swing triggered");
            this.player2Manager.startSwing();
        });
    }

    startSwing() {
        // Use the active player's manager to handle swinging
        if (this.player === this.player1) {
            this.player1Manager.startSwing();
        } else {
            this.player2Manager.startSwing();
        }
    }

    handleBallHit(ball, hitbox) {
        // Determine which player's hitbox was hit
        let player;
        if (hitbox === this.player1Manager.swingHitbox) {
            player = this.player1;
        } else if (hitbox === this.player2Manager.swingHitbox) {
            player = this.player2;
        } else {
            return; // Exit if hitbox doesn't match either player
        }
        
        // Check if the player is swinging
        const isPlayer1Swinging = this.player1Manager.isSwinging;
        const isPlayer2Swinging = this.player2Manager.isSwinging;
        
        if ((player === this.player1 && isPlayer1Swinging) || 
            (player === this.player2 && isPlayer2Swinging)) {
            // Use the Ball class to handle the hit
            this.ballManager.handleHit(player, hitbox);
        }
    }

    // Speed meter updates are now handled by GameManager

    checkBallCollisions() {
      // Use the Ball class to check for collisions with players
      this.ballManager.checkPlayerCollisions(this.player1, this.player2);
    }
    
    resetBallPosition(playerLostLife = null) {
        // Use the Ball class to reset the ball position
        this.ballManager.resetPosition(playerLostLife);
    }
    
    createControlsInfoText() {
        // Create player 1 controls text
        this.add.text(50, 30, 'Player 1: Arrow Keys', {
            fontSize: '24px',
            fill: '#00ff00'
        });
        
        // Create player 2 controls text
        this.add.text(50, 70, 'Player 2: WASD Keys', {
            fontSize: '24px',
            fill: '#0000ff'
        });
    }
    
    // AI functionality is now handled by AIController class

    update() {
        if (!this.isHitStopped) {
            // Make sure player1 is set as the active player for the player controller
            this.player = this.player1;
            
            // Use PlayerController to handle player1 controls
            this.playerController.update(this.cursors);
            
            // Always update player 2 controls with WASD
            this.player2Controller.update();
            
            // Ensure gravity is applied to both players
            this.player1.body.setGravityY(2000);
            this.player2.body.setGravityY(2000);
            
            // Update ball behavior if the ballManager has an update method
            if (this.ballManager.update) {
                this.ballManager.update();
            }

            // Handle ball-player collision based on ownership
            this.checkBallCollisions();
            
            // Update player direction indicators
            this.player1Manager.updateIndicatorPosition();
            this.player2Manager.updateIndicatorPosition();
            
            // Add debug logging to track object positions
            console.log('Player1 position:', this.player1.x, this.player1.y, 'visible:', this.player1.visible);
            console.log('Player2 position:', this.player2.x, this.player2.y, 'visible:', this.player2.visible);
            console.log('Ball position:', this.ball.x, this.ball.y, 'visible:', this.ball.visible);
        }

        // Update speed meter using GameManager
        this.gameManager.updateSpeedMeter(this.ball);

        // Update debug statistics
        this.debugUtils.updateDebugStats();
        
        // Ensure camera is properly centered
        this.cameras.main.centerOn(960, 540);
    }
}