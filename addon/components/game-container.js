import Ember from 'ember';
import layout from '../templates/components/game-container';

export default Ember.Component.extend({
  gameProcessor: Ember.inject.service('game-processor'),
  authManager: Ember.inject.service('session'),  

  init() {  
    this._super(...arguments);
    thisState = this;
  },

  didRender() {
    this._super(...arguments);
    const slug = this.get('gameType.id');
    const turn = this.get('currentTurn');
    this.get('gameProcessor').setMatch(this.get('match'));
    this.get('gameProcessor').showGameType(slug);    
    this.get('gameProcessor').updateTurnHeader(false, turn);
    this.get('gameProcessor').setMover(this.get('mover'));
    
    thisState.get('gameProcessor').determineWinner();
    
  },
  
  actions: {
    clickInside(option) {
      console.log("clicked inside rock paper scissors");
      this.get('registerOptionClick')(option);
    }
  }
});
