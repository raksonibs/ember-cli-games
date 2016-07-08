import Ember from 'ember';
var thisState;

export default Ember.Service.extend({
  socketIOService: Ember.inject.service('socket-io'),
  authManager: Ember.inject.service('session'),
  users: [],

  store: Ember.inject.service(),
  match: null,
  moves: null,
  mover: null,
  gameTypes: [
    {
      name: 'Rock Paper Scissors',
      id: 'rps-select' 
    },
    {
      name: 'Tic Tac Toe',
      id: 'ttt-select' 
    },
    {
      name: 'Stixx',
      id: 'stixx-select' 
    }
  ],

  setMatch(match) {
    this.set('match', match.toJSON());
  },

  setMover(mover) {
    this.set('mover', mover);
    // this.set('moves', mover.get('moves'));
  },

  setMoves(moves) {
    console.log(moves);
  },

  setUsers(users) {
    this.set('users', users);
  },

  init() {
    thisState = this;
    this._super(...arguments);
  },

  arrayEqual(a,b) {
    if (a === b) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }

    return true;
  },

  putXorO(squareClicked) {
    if (thisState.get('game').currentTurn === 1) {
      //  x
      squareClicked.innerHTML = "X";
    } else {
      //  o
      squareClicked.innerHTML = "O";
    }
  },

  game: {
    users: [1, 2],
    currentTurn: 1,
    numMaxMoves: 2,
    currentMoveCount: 0,
    currentGameType: '',
    rps: {
      moves: {1: '', 2: ''},          
    },
    ttt: {          
      moves: {1: [], 2: []},
    },
    stixx: {
      moves: {1: [], 2: []},
    } 
  },

  recordMove(choice) {
    console.log('recording move ' + choice);
    // because this doesn't persist right now, on record move, need to populate the uses' moves in the matches mover
    if (thisState.get('game').currentGameType === "rps") {          
      thisState.get('game')[thisState.get('game').currentGameType].moves[thisState.get('game').currentTurn.toString()] = choice;
    } else {
      thisState.get('game')[thisState.get('game').currentGameType].moves[thisState.get('game').currentTurn.toString()].push(choice);
    }

    const socket = thisState.get('socketIOService').socketFor('http://localhost:3001/');
    var text = "Sending match choice to client by this user " + thisState.get('authManager.currentUser.id') + " with match unique id " + thisState.get('match.uniqueId') + "with choice: " + choice;
    socket.send('We have a winner at: ' + text);
    // is this the true userid?
    socket.emit('recordMove', {
                                data: {
                                  match: thisState.get('match'), 
                                  user_id: thisState.get('authManager.currentUser.id'),
                                  choice: choice
                                }
                              });    
  },

  newUser(user) {
    console.log('checking which user with user id ' + user);
    return user !== thisState.get('game').currentTurn;
  },

  determineRPS(moveOneChoices, moveTwoChoices) {
    var moveOne = moveOneChoices.choices[0];
    var moveTwo = moveTwoChoices.choices[0];

    if (moveOne === "rock" && moveTwo === "paper") {
      thisState.get('updateResultHeader')("2");
    } else if (moveOne === "paper" && moveTwo === "rock") {
      thisState.get('updateResultHeader')("1");
    } else if (moveOne === "paper" && moveTwo === "scissors") {
      thisState.get('updateResultHeader')("2");
    } else if (moveOne === "scissors" && moveTwo === "paper") {
      thisState.get('updateResultHeader')("1");
    } else if (moveOne === "scissors" && moveTwo === "rock") {
      thisState.get('updateResultHeader')("2");
    } else if (moveOne === "rock" && moveTwo === "scissors") {
      thisState.get('updateResultHeader')("1");
    } else {
      thisState.get('updateResultHeader')("draw");
    }

    if (moveTwoChoices.choices.length >= 1 && moveOneChoices.choices.length >= 1) {
      thisState.get('resetChoices')();
    }
  },

  resetChoices() {
    console.log("RESETING CHOICES");
    const socket = thisState.get('socketIOService').socketFor('http://localhost:3001/');
    socket.send('Reseting Choices for mover id: ' + thisState.get('mover.id'));
    // is this the true userid?
    socket.emit('resetMover', { 
                                data: {
                                    mover: thisState.get('mover'),
                                    mover_id: thisState.get('mover.id')
                                      }
                                    });
  },

  resetStix() {
    var sticks = document.querySelectorAll('.stick');
    for (var i=0; i< sticks.length; i++) {
      sticks[i].style.visibility = "visible";
    }
  },

  determineSTIX() {
    console.log("determing winner for stixx");
    // fucking hacks with esy spread, expands into array
    var sticks = [...document.querySelectorAll('.stick')];
    // look for sticks with style visibility
    var bool = sticks.map(function(stick) { return stick.style.visibility !== "hidden"; });
    var sticksLeft = bool.filter(function(boolean) {return boolean === true;}).length;

    if (sticksLeft === 1 || sticksLeft === 0) {
      // then guy whose turn it is lost
      thisState.get('updateResultHeader')(thisState.get('game').currentTurn === "1" ? "2" : "1");
      // setTimeout(function() {
      //   resetStix()
      // }, 5000)
    }
  },

  determineTTT() {
    // user 1 is x
    // user 2 is o
    // can determine out of user moves if won or not
    // winning cominations for ttt are row any and three in a row col
    // all column the same with different row
    // diagonal, so 1,1 2,2, 3,3,
    var winningCombos = [
                          [
                            [1,1], [1,2], [1, 3]
                          ], 
                          [
                            [2,1], [2, 2], [2,3]
                          ], 
                          [
                            [3,1], [3, 2], [3,3]
                          ], 
                          [
                            [1,1], [2, 1], [3,1]
                          ], 
                          [
                            [1,2], [2, 2], [3,2]
                          ], 
                          [
                            [1,3], [2, 3], [3,3]
                          ], 
                          [
                            [1,1], [2, 2], [3,3]
                          ]
                        ];

    var moves =  [...thisState.get('game')[thisState.get('game').currentGameType].moves[thisState.get('game').currentTurn.toString()]];
   
    var threeTruths = [];
    var readableMoves = moves.map((item) => [parseInt(item.row), parseInt(item.col)]);

    for (var i=0; i< winningCombos.length; i++) {
      for (var j=0; j < winningCombos[i].length; j++) {
        // need three trues then win
        for (var k=0; k < readableMoves.length; k++) {
          if (this.get('arrayEqual')(readableMoves[k], winningCombos[i][j])) {
            threeTruths.push(true);
          }
        }            
      }
      if (threeTruths.length === 3) {
        break;
      } else {            
        threeTruths = [];
      }
      
    }

    if (threeTruths.length === 3) {
      thisState.get('updateResultHeader')(thisState.get('game').currentTurn);
    }
  },

  determineWinner() {
    console.log('detererming winner');
    // var moves = thisState.get('mover.moves').toArray();
    var moveOne;
    var moveTwo;

    thisState.get('store').query('move', { mover_id: thisState.get('mover.id') }).then(function(moves) {      
      var moveArray = moves.toArray();
      if (moveArray.length >= 2) {
        moveOne = moveArray[0].toJSON();
        moveTwo = moveArray[1].toJSON();     
        
        if (thisState.get('game').currentGameType === "rps") {
          thisState.get('determineRPS')(moveOne, moveTwo);
          thisState.get('resetGame')();
        } else if (thisState.get('game').currentGameType === "ttt") {
          thisState.get('determineTTT')(moveOne, moveTwo);
        } else {
          thisState.get('determineSTIX');
          thisState.get('resetGame')();
        }
      }
    });
    
  },

  updateResultHeader(userNum) {
    console.log('updating result header with ' + userNum);
    var nodes = document.querySelectorAll('.result');        
    var text;

    if (isNaN(parseInt(userNum))) {
      text = userNum;
    } else {
      // if winner is here, send socket connection
      // create outcomes
      // close match
      // assign wager difference
      const socket = thisState.get('socketIOService').socketFor('http://localhost:3001/');
      text = "Winner is: " + userNum;
      socket.send('We have a winner at: ' + text);
      // is this the true userid?
      socket.emit('winnerMatch', {
                                  data: {
                                    match: thisState.get('match'), 
                                    user_id: userNum,
                                    match_id: thisState.get('match.id')
                                  }
                                });

    }

    for (var i =0; i < nodes.length; i++) {
      nodes[i].textContent = text;
    }
  },

  resetGame() {
    console.log('reseting Game ');
    thisState.get('game').currentMoveCount = 0;
    thisState.get('game')["rps"].moves = { 1: '', 2: '' };
    thisState.get('game')["ttt"].moves = {1: [], 2: []};
    thisState.get('game')["stixx"].moves = {1: [], 2: []};
    thisState.get('updateTurnHeader')(false, "1");
  },

  updateTurnHeader(socket_container, turn) {
    console.log('updating turn header with ' + turn);
    var nodes = document.querySelectorAll('.turn');

    for (var i =0; i < nodes.length; i++) {
      nodes[i].textContent = "Current User Turn is: " + (turn || thisState.get('game').currentTurn);
    }

    if (socket_container === true) {
      console.log("SOCKET CALL IN UPDATE TURN HEADER");
      const socket = thisState.get('socketIOService').socketFor('http://localhost:3001/');
        // this.get('registerOption')(option, this.get('match'));
        // we will get the socket to make the call
      socket.emit('turnChange', {data: {user: thisState.get('authManager.currentUser.id'), match_id: thisState.get('match.uniqueId'), match: thisState.get('match')}});
    }
  },

  updateTurn() {
    console.log('updating turn OVER HERE');
    var newCurrentTurn = thisState.get('game').users.find(thisState.get('newUser'));
    thisState.get('game').currentTurn = newCurrentTurn;
  },

  showGameType(textPassed) {
    console.log('show Game type with id ' + textPassed);
    var text;

    if (textPassed === "1") {
      text = "rps";
    } else if (textPassed === "2") {
      text = "connect4";
    } else if (textPassed === "3") {
      text = "ttt";
    } else {
      text = "stixx";
    }

    if (text === "rps") {
      console.log("showing rock paper scissors");
      thisState.get('game').currentGameType = 'rps';
      thisState.get('gameStart')('rps');
    } else if (text === "stixx") {
      console.log("showing stixx");
      thisState.get('game').currentGameType = 'stixx';
      thisState.get('gameStart')('stixx');
    } else {
      console.log("showing ttt");
      thisState.get('game').currentGameType = 'ttt';
      thisState.get('gameStart')('ttt');
    }
  },

  clearRow(clickedStick) {
    var parent = clickedStick.parentElement;
    var children = parent.children;
    for (var i=0; i < children.length; i++) {
      var stick = children[i];
      if (stick.dataset.col <= clickedStick.dataset.col) {
        stick.style.visibility = "hidden";
      }
    }
  },

  clickHandlerStix() {
    // record which stick clicked,
    // hide all other sticks to the left of the current row
    console.log('recording Move');
    thisState.get('clearRow')(this);
    thisState.get('recordMove')(this.dataset);
    thisState.get('updateTurn')();
    thisState.get('updateTurnHeader')();
    thisState.get('determineWinner')();
  },

  clickHandlerTTT() {
    // record which stick clicked,
    // hide all other sticks to the left of the current row
    console.log('recording Move');
    thisState.get('putXorO')(this);
    thisState.get('recordMove')(this.dataset);
    thisState.get('determineWinner')();
    thisState.get('updateTurn')();
    thisState.get('updateTurnHeader')();
  },

  clickHandler() {
    console.log("clickhandler click with text " + this.textContent);
    console.log(this.textContent);
    thisState.get('recordMove')(this.textContent);
    thisState.get('updateTurn')();
    thisState.get('updateTurnHeader')(true);
    thisState.get('game').currentMoveCount += 1;
    if (thisState.get('game').currentMoveCount === thisState.get('game').numMaxMoves) {          
      thisState.get('determineWinner')();
    }
  },

  setupClickers(buttons, type) {
    for (var i = 0; i < buttons.length; i++) {
      if (type === "rps") {
        buttons[i].addEventListener('click', thisState.get('clickHandler'), false);
      } else if (type === "stixx") {
        buttons[i].addEventListener('click', thisState.get('clickHandlerStix'), false);
      } else {
        buttons[i].addEventListener('click', thisState.get('clickHandlerTTT'), false);
      }
    }
  },

  gameStart(type) {
    console.log("starting game with type " + type);
    var ctns = document.querySelectorAll('.game-ctns');
    for (var i=0; i< ctns.length; i++) {
      ctns[i].style.display = "none";
    }
    // not rendered yet, so should be after render call

    var parentCtn = document.getElementById(type);
    parentCtn.style.display = "block";

    var buttons = document.querySelectorAll("." + type);

    thisState.get('setupClickers')(buttons, type);
    thisState.get('updateTurnHeader')();
  }
});
