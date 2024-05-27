class Level extends Phaser.Scene {
    constructor() {
        super("level");

        this.my = {sprite: {}, text: {}, vfx: {}};
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 2000;
        this.JUMP_VELOCITY = -520;
        this.PARTICLE_VELOCITY = 50;

        this.lives = 3;
        this.score = 0;
        this.checkpointGot = false;
        this.keyGot = false;

        this.playerControl = true;
        this.gameOver = false;
    }

    preload() {
        // load tile animation plugin
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }

    create() {
        let my = this.my;

        // create new tilemap game object
        this.map = this.add.tilemap("level_plains");

        // add tilesets to the map
        this.tileset = this.map.addTilesetImage("Main Tilemap", "tilemap_tiles");
        this.bgTileset = this.map.addTilesetImage("Background Map", "background_tiles");

        // create layers
        this.bgLayer = this.map.createLayer("Background", this.bgTileset, 0, 100).setScrollFactor(0.25);
        this.mgLayer = this.map.createLayer("Midground", this.tileset, 0, 0);
        this.fgLayer = this.map.createLayer("Foreground", this.tileset, 0, 0);
        this.fgLayer.setDepth(1);

        this.animatedTiles.init(this.map);

        // make them collidable
        this.mgLayer.setCollisionByProperty({
            collides: true
        });
        this.fgLayer.setCollisionByProperty({
            collides: true
        });

        // set up key & gate
        this.keyObj = this.map.createFromObjects("KeyAndGate", {
            name: "key",
            key: "tilemap_sheet",
            frame: 27
        });
        this.gate = this.map.createFromObjects("KeyAndGate", [{
            name: "gate",
            key: "tilemap_sheet",
            frame: 9
        },
        {
            name: "keyHole",
            key: "tilemap_sheet",
            frame: 28
        }]);

        this.physics.world.enable(this.keyObj, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.gate, Phaser.Physics.Arcade.STATIC_BODY);

        this.gateGroup = this.add.group(this.gate);

        // set up collectables
        this.coins = this.map.createFromObjects("Collectables", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });
        this.diamonds = this.map.createFromObjects("Collectables", {
            name: "diamond",
            key: "tilemap_sheet",
            frame: 67
        });
        this.extraLives = this.map.createFromObjects("Collectables", {
            name: "extra",
            key: "tilemap_sheet",
            frame: 44
        });

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.diamonds, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.extraLives, Phaser.Physics.Arcade.STATIC_BODY);

        this.coinGroup = this.add.group(this.coins);
        this.diamondGroup = this.add.group(this.diamonds);
        this.extraLifeGroup = this.add.group(this.extraLives);

        // animate collectables
        this.coinGroup.playAnimation("coinSpin");
        this.extraLifeGroup.playAnimation("heart");

        // set up kill zones & win zone
        this.killZones = this.map.createFromObjects("KillZones", {
            name: "killZone",
            key: "tilemap_sheet",
            frame: 145
        });
        this.winZone = this.map.createFromObjects("KillZones", {
            name: "winZone",
            key: "tilemap_sheet",
            frame: 127
        });

        this.physics.world.enable(this.killZones, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.winZone, Phaser.Physics.Arcade.STATIC_BODY);
        this.killZoneGroup = this.add.group(this.killZones);

        // set up player
        this.startSpawn = this.map.createFromObjects("PlayerSpawns", {
            name: "startSpawn",
            key: "tilemap_sheet",
            frame: 158
        });
        this.checkpoint = this.map.createFromObjects("PlayerSpawns", {
            name: "checkpoint",
            key: "tilemap_sheet",
            frame: 158
        });
        my.sprite.player = this.physics.add.sprite(this.startSpawn[0].x, this.startSpawn[0].y, "char_sheet", "char1.png");
        my.sprite.player.setMaxVelocity(700);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.mgLayer);
        this.physics.add.collider(my.sprite.player, this.fgLayer);

        // collision detection with collectables
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.score += 10;
            this.updateText();
            this.sound.play("coinSound", {volume: 0.25});
        });
        this.physics.add.overlap(my.sprite.player, this.diamondGroup, (obj1, obj2) => {
            obj2.destroy(); // remove diamond on overlap
            this.score += 100;
            this.updateText();
            this.sound.play("diamondSound");
        });
        this.physics.add.overlap(my.sprite.player, this.extraLifeGroup, (obj1, obj2) => {
            obj2.destroy(); // remove life on overlap
            this.score += 20;
            this.lives += 1;
            this.updateText();
            this.sound.play("diamondSound");
        });

        // collision detection with key & gate
        this.physics.add.overlap(my.sprite.player, this.keyObj[0], (obj1, obj2) => {
            obj2.destroy(); // remove key on overlap
            this.score += 30;
            this.keyGot = true;
            this.updateText();
            this.sound.play("keySound");
        });
        this.physics.add.overlap(my.sprite.player, this.gateGroup, (obj1, obj2) => {
            if (this.keyGot) {
                obj2.destroy(); // remove gate
                this.sound.play("gateBreak");
            } else {
                obj1.setVelocityX(-this.ACCELERATION);
                this.sound.play("repel");
            }
        });

        // collision detection with kill zones & win zone
        this.physics.add.overlap(my.sprite.player, this.killZoneGroup, (obj1, obj2) => {
            if (this.playerControl) this.playerDeath();
        });
        this.physics.add.overlap(my.sprite.player, this.winZone[0], (obj1, obj2) => {
            this.winGame();
        });

        // controls
        this.keyA = this.input.keyboard.addKey('A');
        this.keyD = this.input.keyboard.addKey('D');
        this.keySpace = this.input.keyboard.addKey('SPACE');

        // vfx
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", { // walking
            frame: ['smoke_03.png', 'smoke_09.png'],
            random: true,
            scale: {start: 0.01, end: 0.05},
            maxAliveParticles: 16,
            lifespan: 350,
            gravityY: -200,
            alpha: {start: 1, end: 0.1},
        });
        my.vfx.jump = this.add.particles(0, 0, "kenny-particles", { // jumping
            frame: "muzzle_02.png",
            random: true,
            scaleX: {start: 0.1, end: 0.2},
            scaleY: {start: 0.01, end: 0.1},
            maxAliveParticles: 1,
            lifespan: 350,
            speedY: -50,
            duration: 100,
            alpha: {start: 1, end: 0.1},
        });
        my.vfx.death = this.add.particles(0, 0, "kenny-particles", { // death
            frame: "smoke_10.png",
            random: true,
            scale: {start: 0.1, end: 0.5},
            maxAliveParticles: 1,
            lifespan: 500,
            duration: 100,
            alpha: {start: 1, end: 0.1},
        });
        my.vfx.walking.stop();
        my.vfx.jump.setDepth(1);
        my.vfx.jump.stop();
        my.vfx.death.setDepth(1);
        my.vfx.death.stop();

        // camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.1); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(24, 0);
        this.cameras.main.setZoom(SCALE);

        // add UI
        my.text.lives = this.add.bitmapText(this.cameras.main.centerX-(this.cameras.main.displayWidth/2), this.cameras.main.centerY-(this.cameras.main.displayHeight/2), "platformerNums", "Lx" + this.lives, 18)
            .setDepth(2)
            .setScrollFactor(0);
        my.text.score = this.add.bitmapText(this.cameras.main.centerX+(this.cameras.main.displayWidth/2), this.cameras.main.centerY-(this.cameras.main.displayHeight/2), "platformerNums", String(this.score).padStart(7, "0"), 18)
            .setOrigin(1, 0)    
            .setDepth(2)
            .setScrollFactor(0);
        my.text.message = this.add.bitmapText(this.cameras.main.centerX, this.cameras.main.centerY-(this.cameras.main.displayHeight/3), "tinyText", "placeholder", 16)
            .setOrigin(0.5, 0)    
            .setDepth(2)
            .setScrollFactor(0);
        my.text.message.visible = false;

        // checkpoint
        this.physics.world.enable(this.checkpoint, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.add.overlap(my.sprite.player, this.checkpoint[0], (obj1, obj2) => {
            if (!this.checkpointGot) {
                this.checkpointGot = true;
                my.text.message.setText("checkpoint");
                my.text.message.visible = true;
                this.sound.play("diamondSound");

                setTimeout(() => {
                    my.text.message.visible = false;
                }, 1000);
            }
        });

        this.physics.world.TILE_BIAS = 36;
    }

    update() {
        let my = this.my;

        if (this.playerControl) {
            // player movement
            if (this.keyA.isDown && this.keyD.isDown) {
                my.sprite.player.setAccelerationX(0);
                my.sprite.player.setDragX(this.DRAG);
                my.sprite.player.anims.play("idle", true);
                my.vfx.walking.stop();
            } else if (this.keyA.isDown) {
                my.sprite.player.setAccelerationX(-this.ACCELERATION);
                my.sprite.player.resetFlip();
                my.sprite.player.anims.play("walk", true);
                // particle following code
                my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-1, false);
                my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

                if (my.sprite.player.body.blocked.down) {
                    my.vfx.walking.start();
                } else {
                    my.vfx.walking.stop();
                }
            } else if (this.keyD.isDown) {
                my.sprite.player.setAccelerationX(this.ACCELERATION);
                my.sprite.player.setFlip(true, false);
                my.sprite.player.anims.play("walk", true);
                // particle following code
                my.vfx.walking.startFollow(my.sprite.player, -4, my.sprite.player.displayHeight/2-1, false);
                my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);

                if (my.sprite.player.body.blocked.down) {
                    my.vfx.walking.start();
                } else {
                    my.vfx.walking.stop();
                }
            } else {
                my.sprite.player.setAccelerationX(0);
                my.sprite.player.setDragX(this.DRAG);
                my.sprite.player.anims.play("idle", true);
                my.vfx.walking.stop();
            }

            if (my.sprite.player.x <= 100) {
                my.sprite.player.setCollideWorldBounds(true);
            } else {
                my.sprite.player.setCollideWorldBounds(false);
            }

            if (!my.sprite.player.body.blocked.down) {
                my.sprite.player.anims.play("jump", true);
                my.vfx.walking.stop();
            }

            if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.keySpace)) {
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                this.cameras.main.setLerp(0.25, 0);
                my.vfx.jump.startFollow(my.sprite.player, 0, my.sprite.player.displayHeight/2, false);
                my.vfx.jump.start();
                this.sound.play("jump", {volume: 0.25});
            } else if (my.sprite.player.body.blocked.down) {
                this.cameras.main.setLerp(0.25, 0.1);
                my.vfx.jump.stop();
            }

            if (my.sprite.player.y > this.cameras.main.scrollY+(this.cameras.main.displayHeight+170) && !my.sprite.player.body.blocked.down) {
                this.cameras.main.setLerp(0.25, 0.12);
            }
        } else {
            // disable player control & enable restart button if this.playerControl is false
            my.vfx.walking.stop();
            my.vfx.jump.stop();
            my.sprite.player.anims.play("idle", true);

            if (Phaser.Input.Keyboard.JustDown(this.keySpace) && this.gameOver) this.scene.restart();
        }
    }

    updateText() {
        let text = this.my.text;

        text.lives.setText("Lx" + this.lives);
        if (this.keyGot) {
            text.score.setText("K   " + String(this.score).padStart(7, "0"));
        } else {
            text.score.setText(String(this.score).padStart(7, "0"));
        }
    }

    playerDeath() {
        let my = this.my;

        this.playerControl = false;
        my.sprite.player.setVelocityX(0);
        my.vfx.death.startFollow(my.sprite.player, 0, 0, false);
        my.vfx.death.start();
        my.sprite.player.visible = false;
        this.cameras.main.shake(200, 0.01);
        this.lives -= 1;
        this.sound.play("death");

        // determine what happens to player after death
        setTimeout(() => {
            if (this.lives <= 0) {
                my.text.message.setText("game over\n\npress space\nto restart");
                my.text.message.visible = true;
                this.gameOver = true;
            } else if (this.checkpointGot) {
                my.sprite.player.x = this.checkpoint[0].x;
                my.sprite.player.y = this.checkpoint[0].y;
                my.sprite.player.visible = true;
                this.playerControl = true;
            } else {
                my.sprite.player.x = this.startSpawn[0].x;
                my.sprite.player.y = this.startSpawn[0].y;
                my.sprite.player.visible = true;
                this.playerControl = true;
            }
    
            this.updateText();
            my.vfx.death.stop();
        }, 1000);
    }

    winGame() {
        let my = this.my;

        this.playerControl = false;
        my.sprite.player.setVelocityX(0);

        my.text.message.setText("you win\n\npress space\nto restart");
        my.text.message.visible = true;

        this.gameOver = true;
    }
}