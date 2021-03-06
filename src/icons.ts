import Vue from 'vue';

import {library} from '@fortawesome/fontawesome-svg-core';
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome';
import {faStop, faPlay, faPause, faChartLine} from '@fortawesome/free-solid-svg-icons';

library.add(faStop, faPlay, faPause, faChartLine);

Vue.component('font-awesome-icon', FontAwesomeIcon);
