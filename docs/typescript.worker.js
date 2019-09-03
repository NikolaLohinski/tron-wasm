!function(e){var t={};function r(o){if(t[o])return t[o].exports;var i=t[o]={i:o,l:!1,exports:{}};return e[o].call(i.exports,i,i.exports,r),i.l=!0,i.exports}r.m=e,r.c=t,r.d=function(e,t,o){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(r.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)r.d(o,i,function(t){return e[t]}.bind(null,i));return o},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=0)}([function(e,t,r){"use strict";var o,i,n,s,l,c,a;r.r(t),function(e){e.MESSAGE="message",e.ERROR="error"}(o||(o={})),function(e){e.BOOT="BOOT",e.REQUEST="REQUEST",e.RESULT="RESULT",e.IDLE="IDLE",e.ERROR="ERROR"}(i||(i={}));class p{static parse(e){const t=new p(e.sizeX,e.sizeY);return t.filled=e.filled,t}static key(e){return`${e.x}-${e.y}`}constructor(e,t){this.sizeX=e,this.sizeY=t,this.filled={}}isEmpty(){return 0===Object.keys(this.filled).length}reset(){this.filled={}}toJson(){return JSON.stringify(this.filled)}getCell(e){return this.filled[p.key(e)]}setCell(e,t){this.getCell(t)||(this.filled[p.key(t)]=[]),this.filled[p.key(t)].push(e)}}class u{constructor(){this.register=(()=>{throw Error("AI has not been initialized")})}init(e,t){return new Promise(t=>{this.register=e,t()})}play(e){throw Error("not implemented")}}!function(e){e.FORWARD="FORWARD",e.LARBOARD="LARBOARD",e.STARBOARD="STARBOARD"}(n||(n={})),function(e){e.CLEAR="CLEAR",e.RUNNING="RUNNING",e.FINISHED="FINISHED"}(s||(s={})),function(e){e.PAUSE="PAUSE",e.RUN="RUN",e.TICK="TICK"}(l||(l={})),function(e){e.PAUSED="PAUSED",e.RUNNING="RUNNING",e.TICKING="TICKING"}(c||(c={})),function(e){e.TS="Typescript",e.RUST="Rust",e.GO="Go"}(a||(a={}));const h=5;const d=self,R=new class{constructor(e,t){this.ctx=e,this.player=t}handleWEvent(e){const t=e.data;this.handleWMessage(t).then(e=>{e&&this.ctx.postMessage(e)}).catch(e=>{const r={workerID:t.workerID,correlationID:t.correlationID,type:i.ERROR,error:e.toString()};console.error(e),this.ctx.postMessage(r)})}handleWMessage(e){return new Promise(t=>{switch(e.type){case i.BOOT:const r=(t,r,o)=>{const n={correlationID:t,type:i.RESULT,workerID:e.workerID,origin:i.REQUEST,depth:o,move:r};this.ctx.postMessage(n)};this.player.init(r,e.parameters).then(()=>{t({workerID:e.workerID,correlationID:e.correlationID,origin:i.BOOT,type:i.IDLE})});break;case i.REQUEST:this.player.play({correlationID:e.correlationID,userID:e.userID,position:e.position,grid:p.parse(e.grid)}).then(()=>{const r={workerID:e.workerID,correlationID:e.correlationID,origin:i.REQUEST,type:i.IDLE};t(r)});break;default:throw Error(`unknown message of type '${e.type}'`)}})}}(d,new class extends u{constructor(){super(...arguments),this.log=!1}init(e,t){return new Promise(r=>{this.register=e,this.depth=t.depth?t.depth:h,this.log=!!t.log,r()})}play(e){return new Promise(t=>{const r={turn:e,map:{},scores:{[n.FORWARD]:0,[n.STARBOARD]:0,[n.LARBOARD]:0}};let o=[{depth:0,position:e.position}];for(let e=0;e<=(this.depth||h);e++){o=this.mergeChildren(r,...o);for(const e of o)this.evaluateNode(r,e);this.evaluateContext(r,e)}t()})}positionMoveTargets(e){if(!e.prev)throw Error("no previous position");const[t,r,o]=e.x-e.prev.x!=0?["x","y",1]:["y","x",-1],i=e[t]-e.prev[t],n=[{[t]:e[t]+i,[r]:e[r]},{[t]:e[t],[r]:e[r]+i*o},{[t]:e[t],[r]:e[r]-i*o}];return n.forEach(t=>t.prev={x:e.x,y:e.y}),n}isInvalid(e,t){return t.x>=e.turn.grid.sizeX||t.x<0||t.y>=e.turn.grid.sizeY||t.y<0||!!e.turn.grid.getCell(t)}getChildrenNodes(e,t){const[r,o,i]=this.positionMoveTargets(t.position);return[{depth:t.depth+1,move:n.FORWARD,origin:t.origin||n.FORWARD,position:r},{depth:t.depth+1,move:n.STARBOARD,origin:t.origin||n.STARBOARD,position:o},{depth:t.depth+1,move:n.LARBOARD,origin:t.origin||n.LARBOARD,position:i}].filter(t=>!this.isInvalid(e,t.position))}mergeChildren(e,...t){return t.reduce((t,r)=>t.concat(this.getChildrenNodes(e,r)),[]).map(e=>({index:Math.random(),child:e})).sort((e,t)=>e.index-t.index).map(e=>e.child)}evaluateNode(e,t){const r=`${t.position.x}-${t.position.y}`,o=e.map[r];o?o.depth<t.depth&&(e.scores[t.origin]+=t.depth,e.scores[o.origin]-=o.depth,e.map[r]=t):(e.map[r]=t,e.scores[t.origin]+=t.depth)}evaluateContext(e,t){const r=Object.entries(e.scores).reduce((t,[r,o])=>e.scores[t]<o?r:t,n.FORWARD);this.register(e.turn.correlationID,r,t)}info(...e){this.log&&console.log(...e)}error(...e){this.log&&console.error(...e)}});d.onmessage=R.handleWEvent.bind(R)}]);