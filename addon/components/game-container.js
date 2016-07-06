import Ember from 'ember';
import layout from '../templates/components/game-container';

export default Ember.Component.extend({
  layout,
  gameProcessor: Ember.inject.service('game-processor'),
  init() {  
    this._super(...arguments);
  },
  didRender() {
    this._super(...arguments);
    const slug = this.get('gameType.id');
    this.get('gameProcessor').setMatch(this.get('match'));
    this.get('gameProcessor').showGameType(slug);
  }
});
