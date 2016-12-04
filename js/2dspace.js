//initialise canvas size
var gameWidth = 800;
var gameHeight = 600;

//initialise audio off
var audioPlaying = false;

window.matchMedia("(min-width: 700px)").addListener(OnPageResized);

OnPageResized();

function OnPageResized()
{
  if (window.matchMedia("(min-width: 700px)").matches)
  {
    //create/recreate div to contain phaser game
    $("#2ds_container").append("<div id='2dspace'></div>");
    //create game
    twoDspace();
  }
}



function twoDspace()
{

//initialise game canvas with window size, embed in div
//set preload, create and update functions
var game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, '2dspace');

//main menu text
//title text display
var titleText;
//instruction text display
var instructionText;
//press space text display
var pressToPlayText;


//whether or not the player is dead - whether to check for restart
var gameOver;

//boolean for whether game is paused or not
var paused;

//pause menu text
var pauseText;

//sound
//background music
var bgm;
//bullet sfx
var bulletSfx;
//explosion sfx
var boomSfx1;
var boomSfx2;
//collision sfx
var collideSfx;
//sci-fi pulse sfx
var pulseSfx;
//button to toggle audio playing
var audioButton;

//player sprite
var ship;
//player aiming reticle
var reticle;

//score
var score;
//text element to display score
var scoreText;

//text element to display number of lives ship has
var livesText;

//bullet firing delay
var firingDelay;
//time since last fire
var lastFire;

//group containing bullets
var bullets;

//group containing explosions
var explosions;

//arrow controls
var cursors;

//group to hold enemies
var enemies;
//number of enemies to spawn
var enemyNo;
//how long between enemy spawns
var spawnDelay;
//time since last enemy spawn
var lastSpawn;

//main menu state
var menuState =
{

  preload: function preload()
  {
    //preload background image
    game.load.image('space', 'gameAssets/2dspace/space.png');
    //preload player ship image
    game.load.image('ship', 'gameAssets/2dspace/ship.png');

    //load pulse sfx
    game.load.audio('pulse', 'gameAssets/2dspace/pulse.mp3');
  },

  create: function create()
  {
    //world is visible
    game.world.visible = true;

    //initialise audio off
    game.audioPlaying = false;

    //create background
    game.add.sprite(-500, 0, 'space');
    //create non-playable version of player ship as background decoration
    var menuShip = game.add.sprite(400, 300, 'ship');
    //set the anchor of the ship to the middle of the sprite
    menuShip.anchor.setTo(0.5, 0.5);
    //scale the sprite to a smaller size
    menuShip.scale.setTo(0.5, 0.5);
    //initialise facing north
    menuShip.angle = 270;

    //display the title
    game.titleText = game.add.text(gameWidth/2, gameHeight/3, "2D SPACE",
    {
      font: "40px Arial",
      fill: "#FFFFFF",
      align: "center"
    });
    //anchor title
    game.titleText.anchor.setTo(0.5, 0.5);
    //display "press to start" prompt
    game.pressToPlayText = game.add.text(gameWidth/2, 2*gameHeight/3, "Press SPACE to play",
    {
      font: "22px Arial",
      fill: "#FFFFFF",
      align: "centre"
    });
    //anchor prompt
    game.pressToPlayText.anchor.setTo(0.5, 0.5);

    //create audio button
    game.audioButton = game.add.text(3*gameWidth/4, 7*gameHeight/8, "Audio is off, click to turn on",
    {
      font: "18px Arial",
      fill: "#FFFFFF",
      align: "centre"
    });
    game.audioButton.anchor.setTo(0.5, 0.5);

    //allow audio button to be clicked on
    game.audioButton.inputEnabled = true;
    //when button is clicked
    game.audioButton.events.onInputUp.add(function(){
      //toggle audio playing
      game.audioPlaying = !game.audioPlaying;
      //change text
      if (game.audioPlaying)
      {
        game.audioButton.text = "Audio is on, click to turn off";
      }
      else
      {
        game.audioButton.text = "Audio is off, click to turn on";
      }
    });

    //capture spacebar so that it doesn't effect browser outside of game
    game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
  },

  update: function update()
  {

    //if spacebar is pressed
    if (game.input.keyboard.isDown( Phaser.Keyboard.SPACEBAR ))
    {
      //play pulse sound
      game.pulseSfx = game.add.audio('pulse');

      if (game.audioPlaying)
      {
        game.pulseSfx.play();
        //once the sound has finished
        game.pulseSfx.onStop.add(function()
        {
          //start game
          game.state.start('play');
        });
      }
      else
      {
        //start game
        game.state.start('play');
      }
    }
  }

};

//main gameplay state
var gameState =
{

  preload: function preload()
  {

    //load background image
    game.load.image('space', 'gameAssets/2dspace/space.png');
    //load player ship image
    game.load.image('ship', 'gameAssets/2dspace/ship.png');
    //load player reticle image
    game.load.image('reticle', 'gameAssets/2dspace/reticle.png');
    //load player bullet image
    game.load.image('bullet', 'gameAssets/2dspace/laser.png');
    //load asteroid image
    game.load.image('asteroid', 'gameAssets/2dspace/asteroid.png');

    //load explosion spritesheet - each frame 64x64, 4 frames
    game.load.spritesheet('explosion', 'gameAssets/2dspace/explosion.png', 64, 64, 4);

    //load background music loop
    game.load.audio('bgm', 'gameAssets/2dspace/bgm.mp3');
    //load laser sfx
    game.load.audio('pew', 'gameAssets/2dspace/laser.mp3');
    //load explosion sfx
    game.load.audio('boom1', 'gameAssets/2dspace/explosion1.mp3');
    game.load.audio('boom2', 'gameAssets/2dspace/explosion2.mp3');
    //load ship collision sfx
    game.load.audio('bang', 'gameAssets/2dspace/shipcollision.mp3');
    //load pulse sfx
    game.load.audio('pulse', 'gameAssets/2dspace/pulse.mp3');

  },

  create: function create()
  {
    //game is visible
    game.world.visible = true;

    //game is not over
    game.gameOver = false;

    //game is not paused
    game.paused = false;

    //add background music
    game.bgm = game.add.audio('bgm', 0.5);
    if (game.audioPlaying)
    {
      //play background music
      game.bgm.play();
      //add event handler for when the music finishes
      game.bgm.onStop.add(function()
      {
        //replay bgm
        game.bgm.play();
      }, this);
    }

    //extend world bounds further than screen edge
    game.world.setBounds(-50, -50, gameWidth + 100, gameHeight + 100);

    //create background
    game.add.sprite(-500, 0, 'space');
    //create player ship and give sprite
    game.ship = game.add.sprite(400, 300, 'ship');
    game.ship.alive = true;
    //set the anchor of the ship to the middle of the sprite
    game.ship.anchor.setTo(0.5, 0.5);
    //scale the sprite to a smaller size
    game.ship.scale.setTo(0.5, 0.5);
    //initialise facing north
    game.ship.angle = 270;
    //initialise ship health
    game.ship.health = 3;
    //length of invincibility after death
    game.ship.invincibility = 0;

    //add physics to the ship
    game.physics.enable(game.ship, Phaser.Physics.ARCADE);

    //create player reticle
    game.reticle = game.add.sprite(400, 100, 'reticle');
    //set anchor of the reticle to middle of sprite
    game.reticle.anchor.setTo(0.5, 0.5);
    //scale reticle to smaller size
    game.reticle.scale.setTo(0.75, 0.75);

    //add ship collision sfx
    game.collideSfx = game.add.audio('bang');

    //initialise score
    game.score = 0;

    //initialise ship speed
    game.ship.currentSpeed = 0;
    //initialise ship slowdown speed
    game.ship.slowdownSpeed = 5;
    //bullet firing delay
    game.firingDelay = 400;
    //initialise lastFire
    game.lastFire = 0;

    //delay between enemy spawns
    game.spawnDelay = 1500;
    //initialise time of last spawn
    game.lastSpawn = 0;

    //initialise bullet group
    //create group
    game.bullets = game.add.group();
    //create 30 bullets using bullet sprite with 0 frames of animation, currently not existing
    game.bullets.createMultiple(15, 'bullet', 0, false);
    //initialise anchor and size
    game.bullets.setAll('anchor.x', 0.5);
    game.bullets.setAll('anchor.y', 0.5);
    game.bullets.setAll('scale.x', 0.3);
    game.bullets.setAll('scale.y', 0.5);
    //destroy bullets when they leave the screen
    game.bullets.setAll('outOfBoundsKill', true);
    game.bullets.setAll('checkWorldBounds', true);
    //add bullet sound effect
    game.bulletSfx = game.add.audio('pew', 0.5);

    //create score text indicator
    game.scoreText = game.add.text(gameWidth/3, 50, 'Score: ' + game.score,
    {
      font: "22px Arial",
      fill: "#FFFFFF",
      align: "center"
    });

    //create lives text indicator
    game.livesText = game.add.text(2*gameWidth/3, 50, 'Lives: ' + game.ship.health,
    {
      font: "22px Arial",
      fill: "#FFFFFF",
      align: "center"
    });

    //create explosion group
    game.explosions = game.add.group();
    //create 10 explosions in group
    game.explosions.createMultiple(10, 'explosion', 0, false);
    //anchor explosion image
    game.explosions.setAll('anchor.x', 0.5);
    game.explosions.setAll('anchor.y', 0.5);
    //animating each explosion
    game.explosions.callAll('animations.add', 'animations', 'explosion', [0, 1, 2, 3], 10, false);
    //add explosion sfx
    game.boomSfx1 = game.add.audio('boom1');
    game.boomSfx2 = game.add.audio('boom2');

    //add pulse sfx
    game.pulseSfx = game.add.audio('pulse');

    //bring ship sprite above all others
    game.ship.bringToTop();
    //bring reticle sprite on top of that
    game.reticle.bringToTop();

    //create arrow key controls
    game.cursors = game.input.keyboard.createCursorKeys();
    //capture spacebar so that it doesn't effect browser outside of game
    game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);

    //start game at first level
    this.startLevel(1);

  },

  startLevel: function(levelNo)
  {
    //variable that determines what level template plays
    var levelType;

    //there are 5 level types and a prologue level type
    //if it's the zeroth level, set type to 0
    if (levelNo == 0)
    {
      levelType = 0;
    }
    //Use modulus to calculate level type
    else if (levelNo % 5 == 1)
    {
      levelType = 1;
    }
    else if (levelNo % 5 == 2)
    {
      levelType = 2;
    }
    else if (levelNo % 5 == 3)
    {
      levelType = 3;
    }
    else if (levelNo % 5 == 4)
    {
      levelType = 4;
    }
    else if (levelNo % 5 == 0)
    {
      levelType = 5;
    }

    //spawn enemies and other considerations based on level type
    switch(levelType)
    {
      //zeroth level - "Prologue"
      case 0:
      break;

      //first/breather level - "Asteroid shower"
      case 1:
        //create enemies
        game.enemies = game.add.group();
        //set number of enemies based on what level it is
        game.enemyNo = 10 + (2 * levelNo);
        //create number of asteroids, 0 frames of animation, currently not existing
        game.enemies.createMultiple(game.enemyNo, 'asteroid', 0, false);
        game.enemies.setAll('enemyType', "asteroid");
        //initialise anchor and size
        game.enemies.setAll('anchor.x', 0.5);
        game.enemies.setAll('anchor.y', 0.5);
        game.enemies.setAll('scale.x', 0.75);
        game.enemies.setAll('scale.y', 0.75);
      break;
    }
  },

  update: function()
  {

    //check for collisions between ship and enemies
    game.physics.arcade.collide(game.ship, game.enemies, this.shipEnemyCollision, null, this);
    //check for collisions between bullets and enemies
    game.physics.arcade.overlap(game.bullets, game.enemies, this.bulletHitEnemy, null, this);
    // //bounce asteroids away from each other
    game.physics.arcade.collide(game.enemies);

    //move reticle towards mouse
    game.reticle.x = game.input.mousePointer.x;
    game.reticle.y = game.input.mousePointer.y;

    //rotate reticle sprite - purely aesthetic
    game.reticle.angle += 5;

    //left and right rotation
    //if left key or A key are held
    if (game.input.keyboard.isDown( Phaser.Keyboard.LEFT ) || game.input.keyboard.isDown( Phaser.Keyboard.A ))
    {
      //rotate left
      game.ship.angle -= 2;
    }
    //if right key or D key are held
    else if (game.input.keyboard.isDown( Phaser.Keyboard.RIGHT ) || game.input.keyboard.isDown( Phaser.Keyboard.D ))
    {
      //rotate right
      game.ship.angle += 2;
    }

    //forward thrust
    //if up key or W key are held
    if (game.input.keyboard.isDown( Phaser.Keyboard.UP ) || game.input.keyboard.isDown( Phaser.Keyboard.W ))
    {
      //speed up
      game.ship.currentSpeed = 250;
    }
    else
    {
      //if the backwards key is held
      if (game.input.keyboard.isDown( Phaser.Keyboard.DOWN ) || game.input.keyboard.isDown( Phaser.Keyboard.S ))
      {
        //if ship is stationary
        if (game.ship.currentSpeed <= 0)
        {
          //reverse
          game.ship.currentSpeed = -150;
        }
        //if ship is in motion
        else
        {
          //just apply brakes
          game.ship.slowdownSpeed = 10;
        }
      }
      else
      {
        //slow down regular amount
        game.ship.slowdownSpeed = 5;
      }
    }

    //and speed is above 0
    if (game.ship.currentSpeed > 0)
    {
      //slow down
      game.ship.currentSpeed -= game.ship.slowdownSpeed;
    }
    //or reverse speed is above 0
    else if (game.ship.currentSpeed < 0)
    {
      //slow down
      game.ship.currentSpeed += game.ship.slowdownSpeed;
    }

    //if no key is held and speed is above 0
    if (game.ship.currentSpeed > 0 || game.ship.currentSpeed < 0)
    {
      //move in direction facing at current speed
      game.physics.arcade.velocityFromRotation(game.ship.rotation, game.ship.currentSpeed, game.ship.body.velocity);
    }

    //if mouse clicks
    if (game.input.activePointer.isDown)
    {
      //attempt to fire bullet
      this.attemptToFire();
    }

    //if space button is pressed
    if (game.input.keyboard.isDown( Phaser.Keyboard.SPACEBAR ))
    {
      //if on game over screen
      if (game.gameOver == true && game.paused == false)
      {
        if (game.audioPlaying)
        {
          //play pulse sound
          game.pulseSfx.play();
          //once the sound has finished
          game.pulseSfx.onStop.add(function()
          {
            //stop playing background music
            game.bgm.stop();
            //quit to main menu
            game.state.start('menu');
          });
        }
        else
        {
          //quit to main menu
          game.state.start('menu');
        }
      }
    }

    //if escape button is pressed
    if (game.input.keyboard.isDown( Phaser.Keyboard.ESC ))
    {
      //if on game over screen
      if (game.gameOver == true && game.paused == false)
      {
        if (game.audioPlaying)
        {
          //play pulse sound
          game.pulseSfx.play();
          //once the sound has finished
          game.pulseSfx.onStop.add(function()
          {
            //stop background music
            game.bgm.stop();

            //quit to main menu
            game.state.start('play');
          });
        }
        else
        {
          //quit to main menu
          game.state.start('play');
        }
      }
      //if game is playing regularly
      else if (game.gameOver == false && game.paused == false)
      {
        //add pause game text
        game.pauseText = game.add.text(gameWidth/2, gameHeight/2, "- GAME PAUSED -\n\nPress ESC to resume\nPress SPACEBAR to quit",
        {
          font: "22px Arial",
          fill: "#FFFFFF",
          align: "center"
        });
        game.pauseText.anchor.setTo(0.5, 0.5);

        //add event listener for esc
        game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.addOnce(function ()
        {
          if (game.paused)
          {
            //get rid of pause text
            game.pauseText.destroy();

            //unpause
            game.paused = false;
          }
        }, this);

        //add event listener for enter
        game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.addOnce(function ()
        {
          if (game.paused)
          {
            if (game.audioPlaying)
            {
              //play pulse sound
              game.pulseSfx.play();
              //once the sound has finished
              game.pulseSfx.onStop.add(function()
              {
                //stop playing background music
                game.bgm.stop();

                //get rid of visuals
                game.world.visible = false;

                //unpause
                game.paused = false;

                //quit to main menu
                game.state.start('menu');
              });
            }
            else
            {
              //get rid of visuals
              game.world.visible = false;

              //unpause
              game.paused = false;

              //quit to main menu
              game.state.start('menu');
            }
          }
        }, this);

        //pause game
        game.paused = true;
      }
    }

    //spawn enemies
    this.spawnEnemies();

    //decrement invincibility
    if (game.ship.invincibility > 0)
    {
      game.ship.invincibility--;
    }

    //check to see if ship has gone off screen and move to other side if so
    this.screenWrap(game.ship);

    //for enemies on screen
    game.enemies.forEachAlive(function(enemy)
    {
      //rotate asteroids
      if (enemy.enemyType == "asteroid")
      {
        //at their set speed
        enemy.angle -= 2 * enemy.speed;
      }

      //check if they're off screen and wrap them around if so
      this.screenWrap(enemy);

    }, this);

    //update score indicator
    game.scoreText.text = "Score: " + game.score;
    game.scoreText.anchor.setTo(0.5, 0.5);

    //update lives text
    game.livesText.text = "Lives: " + game.ship.health;

    game.livesText.anchor.setTo(0.5, 0.5);

    //if player is invincible
    if (game.ship.invincibility > 0)
    {
      //set text red
      game.livesText.fill = "#FF0000";
    }
    //if not
    else
    {
      //set it white
      game.livesText.fill = "#FFFFFF";
    }

    //bring ship sprite above all others
    game.ship.bringToTop();
    //bring reticle sprite on top of that
    game.reticle.bringToTop();
  },

  spawnEnemies: function()
  {
    //if the time since last spawn is more than delay between spawns, and there are enemies remaining, and no more than half the enemies are on screen
    if (game.time.now - game.lastSpawn > game.spawnDelay && game.enemies.countDead() > 0 && game.enemies.countLiving() < game.enemyNo/2)
    {
      //create new enemy from unspawned enemies
      var enemy = game.enemies.getFirstExists(false);
      //set random enemy speed
      enemy.speed = game.rnd.integerInRange(0, 3);

      //enable physics on enemy
      game.physics.enable(enemy, Phaser.Physics.ARCADE);

      //set random offscreen spawn point
      //spawn enemy at random point on x axis
      if (game.rnd.integerInRange(0, 1) == 0)
      {
        //from the top of the screen
        if (game.rnd.integerInRange(0, 1) == 0)
        {
          //spawn
          enemy.reset(game.rnd.integerInRange(50, gameWidth-50), 0);

          //moving downwards
          enemy.body.velocity.y = (100 + (50 * enemy.speed));
        }
        //or the bottom
        else
        {
          //spawn
          enemy.reset(game.rnd.integerInRange(50, gameWidth-50), gameHeight);

          //moving upwards
          enemy.body.velocity.y = -(100 + (50 * enemy.speed));
        }

        //set x velocity pattern
        //if pattern 1
        if (game.rnd.integerInRange(1,3) == 1)
        {
          //set straightforward pattern
          enemy.body.velocity.x = 0;
        }
        //if pattern 2
        else if (game.rnd.integerInRange(1, 3) == 2)
        {
          //set linear pattern
          enemy.body.velocity.x = enemy.body.velocity.y;
        }

      }
      //spawn enemy at random point on y axis
      else
      {
        //from the left of the screen
        if (game.rnd.integerInRange(0, 1) == 0)
        {
          //spawn
          enemy.reset(0, game.rnd.integerInRange(50, gameHeight-50));

          //moving right
          enemy.body.velocity.x = (100 + (50 * enemy.speed));
        }
        //or the right
        else
        {
          //spawn
          enemy.reset(gameWidth, game.rnd.integerInRange(50, gameHeight-50));

          //moving left
          enemy.body.velocity.x = -(100 + (50 * enemy.speed));
        }

        //set x velocity pattern
        //if pattern 1
        if (game.rnd.integerInRange(1, 2) == 1)
        {
          //set straightforward pattern
          enemy.body.velocity.y = 0;
        }
        //if pattern 2
        else if (game.rnd.integerInRange(1, 2) == 2)
        {
          //set linear pattern
          enemy.body.velocity.y = enemy.body.velocity.x;
        }
      }

      //update lastSpawn
      game.lastSpawn = game.time.now;
    }
  },

  attemptToFire: function ()
  {
    //if the ship is still alive
    if (game.ship.alive)
    {
      //if the time since last fire is more than the delay between firing and more bullets can be shot
      if (game.time.now - game.lastFire > game.firingDelay && game.bullets.countDead() > 0)
      {
        //create new bullet from bullets that aren't on screen
        var bullet = game.bullets.getFirstExists(false);

        //give each bullet an arcade physics body
        game.physics.arcade.enable(bullet);
        //set bullet coordinates to current coordinates of ship
        bullet.reset(game.ship.x, game.ship.y);
        //rotate bullet towards point of click give or take a small amount
        bullet.rotation = game.physics.arcade.angleBetween(bullet, game.reticle) + (game.rnd.integerInRange(-1, 1)/10);
        //fire bullet in that direction
        game.physics.arcade.velocityFromRotation(bullet.rotation, game.ship.currentSpeed + 1000, bullet.body.velocity);

        if (game.audioPlaying)
        {
          //play sfx
          game.bulletSfx.play();
        }

        //update lastFire
        game.lastFire = game.time.now;
      }
    }
  },

  shipEnemyCollision: function (ship, enemy)
  {
    //if player is not invincle
    if (ship.invincibility == 0)
    {
      if (game.audioPlaying)
      {
        //play collision sfx
        game.collideSfx.play();
      }

      //damage player
      ship.health--;

      //if run out of lives
      if (ship.health <= 0)
      {
        //kill player
        this.playerDeath();
      }

      //set post-hit invincibility
      ship.invincibility = 75;
    }
  },

  playerDeath: function ()
  {
    //set game over boolean
    game.gameOver = true;

    //get first unused explosion
    var explosionAnimation = game.explosions.getFirstExists(false);
    //set to ship coordinates
    explosionAnimation.reset(game.ship.x, game.ship.y);
    //destroy ship sprite
    game.ship.kill();
    //play animation
    explosionAnimation.play('explosion', 10, false, true);

    if (game.audioPlaying)
    {
      //play one of two explosion sfx
      if (game.rnd.integerInRange(0,1) == 0)
      {
        game.boomSfx1.play();
      }
      else
      {
        game.boomSfx2.play();
      }
    }

    //game over text
    var gameOverText = game.add.text(gameWidth/2, gameHeight/2, "- YOU HAVE FAILED TO PROTECT THE HUMAN RACE -\n\nPress ESC to retry\nPress SPACEBAR to quit",
    {
      font: "25px Arial",
      fill: "#FFFFFF",
      align: "center"
    });
    gameOverText.anchor.setTo(0.5, 0.5);
  },

  bulletHitEnemy: function (bullet, enemy)
  {
    //if the bullet is actually overlapping within the asteroid
    if (bullet.x < enemy.x + 25 && bullet.x > enemy.x - 25 && bullet.y < enemy.y + 25 && bullet.y > enemy.y - 25)
    {
      //destroy bullet
      bullet.kill();

      //create explosion sprite
      var explosionAnimation = game.explosions.getFirstExists(false);
      //move sprite to coordinates of enemy
      explosionAnimation.reset(enemy.x, enemy.y);
      //randomise explosion size
      var explosionSize = game.rnd.integerInRange(1,10);
      explosionSize = explosionSize / 10;
      explosionAnimation.scale.setTo(1+explosionSize, 1+explosionSize);
      //kill enemy sprite
      enemy.kill();
      //play explosion animation in it's place
      explosionAnimation.play('explosion', 10, false, true);

      if (game.audioPlaying)
      {
        //play one of two explosion sfx
        if (game.rnd.integerInRange(0,1) == 0)
        {
          game.boomSfx1.play();
        }
        else
        {
          game.boomSfx2.play();
        }
      }

      //add to score
      game.score += 100;
    }
  },

  screenWrap: function (sprite)
  {

    //store physics values
    var currentVelocityX = sprite.body.velocity.x;
    var currentVelocityY = sprite.body.velocity.y;
    var currentAngle = sprite.angle;

    //store lives and invincibility
    var health = sprite.health;
    var invincibility = sprite.invincibility;

    //store sprite position
    var xPos = sprite.x;
    var yPos = sprite.y;

      if (sprite.x < -25)
      {
        //kill the sprite and reset it at new position
        sprite.kill();
        sprite.reset(gameWidth+25, yPos);
      }
      else if (sprite.x > gameWidth+25)
      {
        //kill the sprite and reset it at new position
        sprite.kill();
        sprite.reset(-25, yPos);
      }

      if (sprite.y < -25)
      {
        //kill the sprite and reset it at new position
        sprite.kill();
        sprite.reset(xPos, gameHeight+25);
      }
      else if (sprite.y > gameHeight+25)
      {
        //kill the sprite and reset it at new position
        sprite.kill();
        sprite.reset(xPos, -25);
      }

      //restore physics values
      sprite.body.velocity.x = currentVelocityX;
      sprite.body.velocity.y = currentVelocityY;
      sprite.angle = currentAngle;
      sprite.health = health;
      sprite.invincibility = invincibility;
  }
};



//create gamestates
game.state.add('menu', menuState);
game.state.add('play', gameState);

//start game
game.state.start('menu');

}
