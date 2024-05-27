class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        // set path for assets
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlasXML("char_sheet", "tilemap-characters_packed.png", "tilemap-characters.xml");

        // Load tilemap information
        this.load.image("tilemap_tiles", "tilemap_packed.png");
        this.load.image("background_tiles", "tilemap-backgrounds_packed.png");
        this.load.tilemapTiledJSON("level_plains", "PlacidPlains.tmj");

        // Load the tilemap as a spritesheet
        this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        this.load.spritesheet("background_tilemap_sheet", "tilemap-backgrounds_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        // load fonts
        this.load.bitmapFont("platformerNums", "platformerNums.png", "platformerNums.xml");
        this.load.bitmapFont("tinyText", "tinyski_bitmap.png", "tinyski_bitmap.xml");

        // load particle effects
        this.load.multiatlas("kenny-particles", "kenny-particles.json");

        // load audio
        this.load.audio("jump", "footstep_carpet_003.ogg");
        this.load.audio("keySound", "impactMining_001.ogg");
        this.load.audio("coinSound", "impactGlass_light_000.ogg");
        this.load.audio("diamondSound", "impactGlass_heavy_002.ogg");
        this.load.audio("repel", "impactPlate_light_001.ogg");
        this.load.audio("gateBreak", "impactPlate_medium_004.ogg");
        this.load.audio("death", "footstep_grass_001.ogg");
    }

    create() {
        // create player animations
        this.anims.create({
            key: "walk",
            frames: [
                {key: "char_sheet", frame: "char1.png"},
                {key: "char_sheet", frame: "char2.png"}
            ],
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: "idle",
            frames: [
                {key: "char_sheet", frame: "char1.png"}
            ],
            repeat: -1
        });
        this.anims.create({
            key: "jump",
            frames: [
                {key: "char_sheet", frame: "char2.png"}
            ],
            repeat: -1
        });

        // create item animations
        this.anims.create({
            key: "coinSpin",
            defaultTextureKey: "tilemap_sheet",
            frames: [
                {frame: 151}, {frame: 152}
            ],
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: "heart",
            defaultTextureKey: "tilemap_sheet",
            frames: [
                {frame: 44}, {frame: 46}
            ],
            frameRate: 2,
            repeat: -1
        });

        // immediately load next scene
        this.scene.start("level");
    }

    update() {}
}