import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: MainScene
};

const game = new Phaser.Game(config);

let ball;
const BALL_SPEED = 300;

function preload() {
    // Load a temporary circle as the ball
    this.load.circle('ball', 10, 0xffffff);
}

function create() {
    // Create the ball sprite with physics
    ball = this.add.circle(400, 300, 10, 0xffffff);
    this.physics.add.existing(ball);

    // Set ball properties
    ball.body.setCollideWorldBounds(true);
    ball.body.setBounce(1, 1);
    ball.body.setVelocity(BALL_SPEED, BALL_SPEED);

    // Enable ball to maintain velocity after collision
    ball.body.setMaxVelocity(1000, 1000);
}

function update() {
    // Ball will automatically bounce off world bounds due to physics settings
}