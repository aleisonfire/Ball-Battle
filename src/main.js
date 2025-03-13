import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

const config = {
    type: Phaser.CANVAS, // Changed from Phaser.AUTO
    width: 1920,
    height: 1080,
    parent: 'game',
    backgroundColor: '#D253FC',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 2000 },
            debug: false,  // Changed from true to false
            debugShowBody: false,  // Changed from true to false
            debugShowStaticBody: false  // Changed from true to false
        }
    },
    scene: MainScene
};

// Initialize the Phaser game instance
const game = new Phaser.Game(config);