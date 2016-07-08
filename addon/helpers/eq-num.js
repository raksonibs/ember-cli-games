import Ember from 'ember';

const eqNum = (params) => parseInt(params[0]) === parseInt(params[1]);

export default Ember.Helper.helper(eqNum);
