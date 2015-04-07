define("fairshare-site/app",["exports","ember","ember/resolver","ember/load-initializers","fairshare-site/config/environment"],function(e,t,a,r,n){"use strict";t["default"].MODEL_FACTORY_INJECTIONS=!0;var i=t["default"].Application.extend({modulePrefix:n["default"].modulePrefix,podModulePrefix:n["default"].podModulePrefix,Resolver:a["default"]});r["default"](i,n["default"].modulePrefix),e["default"]=i}),define("fairshare-site/client",["exports","fairshare-site/config/environment"],function(e,t){"use strict";e["default"]=window.reddit=new Snoocore({userAgent:"FairShare 0.0.1 by go1dfish",decodeHtmlEntities:!0,oauth:{type:"implicit",mobile:!1,duration:"temporary",consumerKey:t["default"].consumerKey,redirectUri:t["default"].redirectUrl,scope:["submit","read","identity"]}})}),define("fairshare-site/components/growl-instance",["exports","ember"],function(e,t){"use strict";e["default"]=t["default"].Component.extend({classNames:["growl-instance"],classNameBindings:["type"],type:function(){return this.get("notification.options.type")}.property(),click:function(){this.destroyAlert()},didInsertElement:function(){if(this.get("notification.options.fadeIn")&&this.$().hide().fadeIn(),this.get("notification.options.twitch")){var e,a=this.$(),r=1,n=window.setInterval(function(){e=e?"":"-",a.css("transform","rotate("+e+r+"deg)")},75);t["default"].run.later(function(){a.css("transform","rotate(0deg)"),window.clearInterval(n)},400)}this.get("notification.options.clickToDismiss")||t["default"].run.later(this,this.destroyAlert,this.get("notification.options.closeIn"))},destroyAlert:function(){var e=this;this.$()?this.$().fadeOut(t["default"].run(this,function(){e.sendAction("action",e.get("notification"))})):e.sendAction("action",e.get("notification"))},actions:{dismiss:function(){this.destroyAlert()}}})}),define("fairshare-site/components/growl-manager",["exports","ember"],function(e,t){"use strict";e["default"]=t["default"].Component.extend({classNames:["growl-manager"],actions:{dismiss:function(e){this.get("notifications").removeObject(e)}}})}),define("fairshare-site/controllers/application",["exports","ember","fairshare-site/client"],function(e,t,a){"use strict";e["default"]=t["default"].Controller.extend({queryParams:["access_token"],user:t["default"].computed.alias("model"),loginUrl:function(){return a["default"].getImplicitAuthUrl()}.property("user"),loginExpiry:function(){return this.get("loginExpires")}.property("loginExpires","timeupdater.currentMoment"),updateUserData:function(){this.get("user")&&a["default"]("/api/v1/me").get().then(function(e){this.set("user",e)}.bind(this))["catch"](function(){this.growl.alert(['<div class="message">Logged out</div>'].join("\n"),{clickToDismiss:!0}),this.set("user",null)}.bind(this))}.observes("timeupdater.currentMoment")})}),define("fairshare-site/controllers/login",["exports","ember"],function(e,t){"use strict";e["default"]=t["default"].Controller.extend({needs:["application"],loginUrl:t["default"].computed.alias("controllers.application.loginUrl")})}),define("fairshare-site/controllers/ubi",["exports","ember"],function(e,t){"use strict";e["default"]=t["default"].ObjectController.extend({ubiPool:3e7,percentage:10,total:function(){return parseInt(parseInt(this.get("ubiPool"))*(this.get("percentage")/100))}.property("ubiPool","ratio"),beneficiaryCount:function(e,t){return t?parseInt(t):this.get("beneficiaries.length")}.property("beneficiaries.length"),fairShare:function(){var e=this.get("beneficiaryCount");return e?Math.floor(this.get("total")/e):this.get("total")}.property("beneficiaryCount","total")})}),define("fairshare-site/initializers/app-version",["exports","fairshare-site/config/environment","ember"],function(e,t,a){"use strict";var r=a["default"].String.classify,n=!1;e["default"]={name:"App Version",initialize:function(e,i){if(!n){var d=r(i.toString());a["default"].libraries.register(d,t["default"].APP.version),n=!0}}}}),define("fairshare-site/initializers/ember-cli-dates",["exports","ember","ember-cli-dates/helpers/time-format","ember-cli-dates/helpers/time-ago-in-words","ember-cli-dates/helpers/day-of-the-week","ember-cli-dates/helpers/time-ahead-in-words","ember-cli-dates/helpers/time-delta-in-words","ember-cli-dates/helpers/month-and-year","ember-cli-dates/helpers/month-and-day","ember-cli-dates/helpers/date-and-time"],function(e,t,a,r,n,i,d,c,o,l){"use strict";var s=function(){t["default"].Handlebars.helper("time-format",a.timeFormat),t["default"].Handlebars.helper("time-ago-in-words",r.timeAgoInWords),t["default"].Handlebars.helper("day-of-the-week",n.dayOfTheWeek),t["default"].Handlebars.helper("time-ahead-in-words",i.timeAheadInWords),t["default"].Handlebars.helper("time-delta-in-words",d.timeDeltaInWords),t["default"].Handlebars.helper("month-and-year",c.monthAndYear),t["default"].Handlebars.helper("month-and-day",o.monthAndDay),t["default"].Handlebars.helper("date-and-time",l.dateAndTime)};e["default"]={name:"ember-cli-dates",initialize:s},e.initialize=s}),define("fairshare-site/initializers/export-application-global",["exports","ember","fairshare-site/config/environment"],function(e,t,a){"use strict";function r(e,r){var n=t["default"].String.classify(a["default"].modulePrefix);a["default"].exportApplicationGlobal&&!window[n]&&(window[n]=r)}e.initialize=r,e["default"]={name:"export-application-global",initialize:r}}),define("fairshare-site/initializers/growl",["exports","fairshare-site/services/growl"],function(e,t){"use strict";e["default"]={name:"growl",initialize:function(e,a){t["default"].reopenClass({container:e}),a.register("growl:main",t["default"]),a.inject("route","growl","growl:main"),a.inject("controller","growl","growl:main")}}}),define("fairshare-site/router",["exports","ember","fairshare-site/config/environment"],function(e,t,a){"use strict";var r=t["default"].Router.extend({location:a["default"].locationType});e["default"]=r.map(function(){this.route("ubi"),this.route("privacy")})}),define("fairshare-site/routes/application",["exports","ember","fairshare-site/client"],function(e,t,a){"use strict";function r(e){e=e.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var t=new RegExp("[\\?&]"+e+"=([^&#]*)"),a=t.exec(location.hash.replace(/^#/,"?"));return null===a?"":decodeURIComponent(a[1].replace(/\+/g," "))}e["default"]=t["default"].Route.extend({model:function(){var e=r("access_token");return e?(this.controllerFor("application").set("loginExpires",moment().add(parseInt(r("expires_in")),"second")),window.location.hash="",a["default"].auth(e).then(function(){return a["default"]("/api/v1/me").get()}).then(function(e){return this.growl.info(["<h1>Logged in as",e.name,"</h1>",'<div class="message">',"V for reddit will now poll for new (mod) mail","</div>"].join("\n")),e}.bind(this))):void this.growl.info(['<h1>Welcome to <em>V for reddit</em></h1><div class="message">',"<p>This is still an early and incomplete alpha!</p></div>"].join("\n"),{closeIn:6e3})},redirect:function(e){return this.transitionTo("ubi")},actions:{logout:function(){a["default"].deauth().then(function(){this.controllerFor("application").set("user",null)}.bind(this))["catch"](function(e){console.error(e.stack||e),alert("Logout is broken due to a Snoocore bug, but if you refresh I forget your token.  So I'll do that now"),window.location.reload()})}}})}),define("fairshare-site/routes/ubi",["exports","ember","fairshare-site/client"],function(e,t,a){"use strict";e["default"]=t["default"].Route.extend({model:function(){return a["default"]("/r/GetFairShare/new").get().then(function(e){return(((e||{}).data||{}).children||[]).getEach("data")}).then(function(e){return e.find(function(e){return e.title.match(/Prototype Distribution/)})}).then(function(e){return a["default"]("/r/GetFairShare/comments/"+e.id+".json").get().then(function(t){return e.comments=t[1].data.children.getEach("data"),e.beneficiaries=e.comments.getEach("author").uniq().without("PoliticBot").without("[deleted]"),e})})}})}),define("fairshare-site/services/growl",["exports","ember"],function(e,t){"use strict";e["default"]=t["default"].Object.extend({notifications:t["default"].A(),error:function(e,t){t=t||{},t.type="error",this._notify.call(this,e,t)},alert:function(e,t){t=t||{},t.type="alert",this._notify.call(this,e,t)},info:function(e,t){t=t||{},t.type="info",this._notify.call(this,e,t)},_notify:function(e,a){var r={type:"error",fadeIn:!0,closeIn:5e3,clickToDismiss:!1,twitch:!1};t["default"].merge(r,a);var n=this.get("notifications").findBy("content",e);if(!n){var i=t["default"].ObjectProxy.extend({content:e,options:r,updated:0,isInfo:function(){return"info"===r.type}.property(),isAlert:function(){return"alert"===r.type}.property(),isError:function(){return"error"===r.type}.property()}).create();this.get("notifications").pushObject(i)}}})}),define("fairshare-site/templates/application",["exports"],function(e){"use strict";e["default"]=Ember.HTMLBars.template(function(){var e=function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("\n          ");e.appendChild(t,a);var a=e.createElement("a");e.setAttribute(a,"title","logout");var r=e.createTextNode("Logout: ");e.appendChild(a,r);var r=e.createComment("");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom,n=t.hooks,i=n.element,d=n.content;r.detectNamespace(a);var c;t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(c=this.build(r),this.hasRendered?this.cachedFragment=c:this.hasRendered=!0),this.cachedFragment&&(c=r.cloneNode(this.cachedFragment,!0))):c=this.build(r);var o=r.childAt(c,[1]),l=r.createMorphAt(o,1,1);return i(t,o,e,"action",["logout"],{}),d(t,l,e,"user.name"),c}}}(),t=function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("          ");e.appendChild(t,a);var a=e.createElement("a");e.setAttribute(a,"title","Login");var r=e.createTextNode("Login at reddit.com");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n        ");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom,n=t.hooks,i=n.get,d=n.element;r.detectNamespace(a);var c;t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(c=this.build(r),this.hasRendered?this.cachedFragment=c:this.hasRendered=!0),this.cachedFragment&&(c=r.cloneNode(this.cachedFragment,!0))):c=this.build(r);var o=r.childAt(c,[1]);return d(t,o,e,"bind-attr",[],{href:i(t,e,"loginUrl")}),c}}}();return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createElement("div");e.setAttribute(a,"class","navbar navbar-default navbar-fixed-top");var r=e.createTextNode("\n  ");e.appendChild(a,r);var r=e.createElement("div");e.setAttribute(r,"class","container");var n=e.createTextNode("\n    ");e.appendChild(r,n);var n=e.createElement("div");e.setAttribute(n,"class","navbar-header");var i=e.createTextNode("\n      ");e.appendChild(n,i);var i=e.createComment("");e.appendChild(n,i);var i=e.createTextNode("\n    ");e.appendChild(n,i),e.appendChild(r,n);var n=e.createTextNode("\n    ");e.appendChild(r,n);var n=e.createElement("div");e.setAttribute(n,"id","navbar"),e.setAttribute(n,"class","navbar-collapse collapse");var i=e.createTextNode("\n      ");e.appendChild(n,i);var i=e.createElement("ul");e.setAttribute(i,"class","nav navbar-nav");var d=e.createTextNode("\n        ");e.appendChild(i,d);var d=e.createElement("li"),c=e.createElement("a");e.setAttribute(c,"target","reddit"),e.setAttribute(c,"href","https://reddit.com/r/FairShare");var o=e.createTextNode("on reddit");e.appendChild(c,o),e.appendChild(d,c),e.appendChild(i,d);var d=e.createTextNode("\n      ");e.appendChild(i,d),e.appendChild(n,i);var i=e.createTextNode("\n      ");e.appendChild(n,i);var i=e.createElement("ul");e.setAttribute(i,"class","nav navbar-nav navbar-right");var d=e.createTextNode("\n        ");e.appendChild(i,d);var d=e.createElement("li"),c=e.createComment("");e.appendChild(d,c),e.appendChild(i,d);var d=e.createTextNode("\n        ");e.appendChild(i,d);var d=e.createElement("li"),c=e.createComment("");e.appendChild(d,c),e.appendChild(i,d);var d=e.createTextNode("\n      ");e.appendChild(i,d),e.appendChild(n,i);var i=e.createTextNode("\n    ");e.appendChild(n,i),e.appendChild(r,n);var n=e.createTextNode("\n  ");e.appendChild(r,n),e.appendChild(a,r);var r=e.createTextNode("\n");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");e.appendChild(t,a);var a=e.createElement("div");e.setAttribute(a,"id","maincontainer"),e.setAttribute(a,"class","container");var r=e.createComment("");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(a,r,n){var i=r.dom,d=r.hooks,c=d.inline,o=d.get,l=d.block,s=d.content;i.detectNamespace(n);var h;r.useFragmentCache&&i.canClone?(null===this.cachedFragment&&(h=this.build(i),this.hasRendered?this.cachedFragment=h:this.hasRendered=!0),this.cachedFragment&&(h=i.cloneNode(this.cachedFragment,!0))):h=this.build(i);var p=i.childAt(h,[0,1]),u=i.childAt(p,[3,3]),m=i.createMorphAt(i.childAt(p,[1]),1,1),f=i.createMorphAt(i.childAt(u,[1]),0,0),v=i.createMorphAt(i.childAt(u,[3]),0,0),C=i.createMorphAt(i.childAt(h,[2]),0,0);return c(r,m,a,"link-to",["Fair-Share","ubi"],{"class":"navbar-brand"}),c(r,f,a,"link-to",["Privacy Policy","privacy"],{}),l(r,v,a,"if",[o(r,a,"user")],{},e,t),s(r,C,a,"outlet"),h}}}())}),define("fairshare-site/templates/components/growl-instance",["exports"],function(e){"use strict";e["default"]=Ember.HTMLBars.template(function(){var e=function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("  ");e.appendChild(t,a);var a=e.createElement("img");e.setAttribute(a,"src","../img/error.svg"),e.setAttribute(a,"alt","Error"),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom;r.detectNamespace(a);var n;return t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(n=this.build(r),this.hasRendered?this.cachedFragment=n:this.hasRendered=!0),this.cachedFragment&&(n=r.cloneNode(this.cachedFragment,!0))):n=this.build(r),n}}}(),t=function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("  ");e.appendChild(t,a);var a=e.createElement("img");e.setAttribute(a,"src","../img/alert.svg"),e.setAttribute(a,"alt","Alert"),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom;r.detectNamespace(a);var n;return t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(n=this.build(r),this.hasRendered?this.cachedFragment=n:this.hasRendered=!0),this.cachedFragment&&(n=r.cloneNode(this.cachedFragment,!0))):n=this.build(r),n}}}(),a=function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("  ");e.appendChild(t,a);var a=e.createElement("img");e.setAttribute(a,"src","../img/info.svg"),e.setAttribute(a,"alt","Info"),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom;r.detectNamespace(a);var n;return t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(n=this.build(r),this.hasRendered?this.cachedFragment=n:this.hasRendered=!0),this.cachedFragment&&(n=r.cloneNode(this.cachedFragment,!0))):n=this.build(r),n}}}(),r=function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("    ");e.appendChild(t,a);var a=e.createElement("h1"),r=e.createTextNode("Uh oh.");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom;r.detectNamespace(a);var n;return t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(n=this.build(r),this.hasRendered?this.cachedFragment=n:this.hasRendered=!0),this.cachedFragment&&(n=r.cloneNode(this.cachedFragment,!0))):n=this.build(r),n}}}(),n=function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("    ");e.appendChild(t,a);var a=e.createElement("h1"),r=e.createTextNode("Attention!");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom;r.detectNamespace(a);var n;return t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(n=this.build(r),this.hasRendered?this.cachedFragment=n:this.hasRendered=!0),this.cachedFragment&&(n=r.cloneNode(this.cachedFragment,!0))):n=this.build(r),n}}}(),i=function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("    ");e.appendChild(t,a);var a=e.createElement("h1"),r=e.createTextNode("Hey!");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom;r.detectNamespace(a);var n;return t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(n=this.build(r),this.hasRendered?this.cachedFragment=n:this.hasRendered=!0),this.cachedFragment&&(n=r.cloneNode(this.cachedFragment,!0))):n=this.build(r),n}}}();return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("\n");e.appendChild(t,a);var a=e.createComment("");e.appendChild(t,a);var a=e.createTextNode("\n");e.appendChild(t,a);var a=e.createComment("");e.appendChild(t,a);var a=e.createTextNode("\n");e.appendChild(t,a);var a=e.createComment("");e.appendChild(t,a);var a=e.createTextNode("\n");e.appendChild(t,a);var a=e.createElement("div");e.setAttribute(a,"class","message-area");var r=e.createTextNode("\n");e.appendChild(a,r);var r=e.createComment("");e.appendChild(a,r);var r=e.createTextNode("\n");e.appendChild(a,r);var r=e.createComment("");e.appendChild(a,r);var r=e.createTextNode("\n");e.appendChild(a,r);var r=e.createComment("");e.appendChild(a,r);var r=e.createTextNode("\n  ");e.appendChild(a,r);var r=e.createElement("div");e.setAttribute(r,"class","message");var n=e.createTextNode("\n    ");e.appendChild(r,n);var n=e.createComment("");e.appendChild(r,n);var n=e.createTextNode("\n  ");e.appendChild(r,n),e.appendChild(a,r);var r=e.createTextNode("\n");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(d,c,o){var l=c.dom,s=c.hooks,h=s.get,p=s.block,u=s.content;l.detectNamespace(o);var m;c.useFragmentCache&&l.canClone?(null===this.cachedFragment&&(m=this.build(l),this.hasRendered?this.cachedFragment=m:this.hasRendered=!0),this.cachedFragment&&(m=l.cloneNode(this.cachedFragment,!0))):m=this.build(l);var f=l.childAt(m,[7]),v=l.createMorphAt(m,1,1,o),C=l.createMorphAt(m,3,3,o),g=l.createMorphAt(m,5,5,o),b=l.createMorphAt(f,1,1),x=l.createMorphAt(f,3,3),N=l.createMorphAt(f,5,5),T=l.createUnsafeMorphAt(l.childAt(f,[7]),1,1);return p(c,v,d,"unboundIf",[h(c,d,"notification.isError")],{},e,null),p(c,C,d,"unboundIf",[h(c,d,"notification.isAlert")],{},t,null),p(c,g,d,"unboundIf",[h(c,d,"notification.isInfo")],{},a,null),p(c,b,d,"unboundIf",[h(c,d,"notification.isError")],{},r,null),p(c,x,d,"unboundIf",[h(c,d,"notification.isAlert")],{},n,null),p(c,N,d,"unboundIf",[h(c,d,"notification.isInfo")],{},i,null),u(c,T,d,"notification.content"),m}}}())}),define("fairshare-site/templates/components/growl-manager",["exports"],function(e){"use strict";e["default"]=Ember.HTMLBars.template(function(){var e=function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("  ");e.appendChild(t,a);var a=e.createComment("");e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom,n=t.hooks,i=n.get,d=n.inline;r.detectNamespace(a);var c;t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(c=this.build(r),this.hasRendered?this.cachedFragment=c:this.hasRendered=!0),this.cachedFragment&&(c=r.cloneNode(this.cachedFragment,!0))):c=this.build(r);var o=r.createMorphAt(c,1,1,a);return d(t,o,e,"growl-instance",[],{action:"dismiss",notification:i(t,e,"notification")}),c}}}();return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("\n");e.appendChild(t,a);var a=e.createComment("");return e.appendChild(t,a),t},render:function(t,a,r){var n=a.dom,i=a.hooks,d=i.get,c=i.block;n.detectNamespace(r);var o;a.useFragmentCache&&n.canClone?(null===this.cachedFragment&&(o=this.build(n),this.hasRendered?this.cachedFragment=o:this.hasRendered=!0),this.cachedFragment&&(o=n.cloneNode(this.cachedFragment,!0))):o=this.build(n);var l=n.createMorphAt(o,1,1,r);return n.insertBoundary(o,null),c(a,l,t,"each",[d(a,t,"notifications")],{keyword:"notification"},e,null),o}}}())}),define("fairshare-site/templates/index",["exports"],function(e){"use strict";e["default"]=Ember.HTMLBars.template(function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createElement("h2"),r=e.createTextNode("Homepage");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom;r.detectNamespace(a);var n;return t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(n=this.build(r),this.hasRendered?this.cachedFragment=n:this.hasRendered=!0),this.cachedFragment&&(n=r.cloneNode(this.cachedFragment,!0))):n=this.build(r),n}}}())}),define("fairshare-site/templates/loading",["exports"],function(e){"use strict";e["default"]=Ember.HTMLBars.template(function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createElement("h3");e.setAttribute(a,"class","loading");var r=e.createTextNode("Loading...");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom;r.detectNamespace(a);var n;return t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(n=this.build(r),this.hasRendered?this.cachedFragment=n:this.hasRendered=!0),this.cachedFragment&&(n=r.cloneNode(this.cachedFragment,!0))):n=this.build(r),n}}}())}),define("fairshare-site/templates/login",["exports"],function(e){"use strict";e["default"]=Ember.HTMLBars.template(function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createElement("a");e.setAttribute(a,"title","Login");var r=e.createTextNode("Login at reddit.com");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom,n=t.hooks,i=n.get,d=n.element;r.detectNamespace(a);var c;t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(c=this.build(r),this.hasRendered?this.cachedFragment=c:this.hasRendered=!0),this.cachedFragment&&(c=r.cloneNode(this.cachedFragment,!0))):c=this.build(r);var o=r.childAt(c,[0]);return d(t,o,e,"bind-attr",[],{href:i(t,e,"loginUrl")}),c}}}())}),define("fairshare-site/templates/privacy",["exports"],function(e){"use strict";e["default"]=Ember.HTMLBars.template(function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createElement("h1"),r=e.createTextNode("Privacy Policy");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");e.appendChild(t,a);var a=e.createElement("h4"),r=e.createTextNode("\nThis is separate from\n");e.appendChild(a,r);var r=e.createElement("a");e.setAttribute(r,"href","https://www.reddit.com/help/privacypolicy"),e.setAttribute(r,"class","dontintercept");var n=e.createTextNode("reddit.com's Privacy Policy");e.appendChild(r,n),e.appendChild(a,r);var r=e.createTextNode("\n");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");e.appendChild(t,a);var a=e.createElement("p"),r=e.createTextNode("This app runs entirely in your browser and never phones home.");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");e.appendChild(t,a);var a=e.createElement("p"),r=e.createTextNode("There is no home to phone, this app is hosted on github pages.");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");e.appendChild(t,a);var a=e.createElement("p"),r=e.createTextNode("No data gets stored or sent back to non-reddit servers.");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");e.appendChild(t,a);var a=e.createElement("p"),r=e.createTextNode("You can verify this using your browser's network inspector.");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom;r.detectNamespace(a);var n;return t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(n=this.build(r),this.hasRendered?this.cachedFragment=n:this.hasRendered=!0),this.cachedFragment&&(n=r.cloneNode(this.cachedFragment,!0))):n=this.build(r),n}}}())}),define("fairshare-site/templates/ubi",["exports"],function(e){"use strict";e["default"]=Ember.HTMLBars.template(function(){var e=function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("        ");e.appendChild(t,a);var a=e.createElement("li");e.setAttribute(a,"class","media");var r=e.createTextNode("\n          ");e.appendChild(a,r);var r=e.createElement("div");e.setAttribute(r,"class","media-body");var n=e.createTextNode("\n            ");e.appendChild(r,n);var n=e.createElement("h4");e.setAttribute(n,"class","media-heading");var i=e.createComment("");e.appendChild(n,i),e.appendChild(r,n);var n=e.createTextNode("\n            ");e.appendChild(r,n);var n=e.createComment("");e.appendChild(r,n);var n=e.createTextNode("\n          ");e.appendChild(r,n),e.appendChild(a,r);var r=e.createTextNode("\n        ");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom,n=t.hooks,i=n.content;r.detectNamespace(a);var d;t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(d=this.build(r),this.hasRendered?this.cachedFragment=d:this.hasRendered=!0),this.cachedFragment&&(d=r.cloneNode(this.cachedFragment,!0))):d=this.build(r);var c=r.childAt(d,[1,1]),o=r.createMorphAt(r.childAt(c,[1]),0,0),l=r.createUnsafeMorphAt(c,3,3);return i(t,o,e,"author"),i(t,l,e,"body_html"),d}}}(),t=function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("    ");e.appendChild(t,a);var a=e.createElement("h3"),r=e.createTextNode("Closed ");e.appendChild(a,r);var r=e.createComment("");e.appendChild(a,r);var r=e.createTextNode(" : ");e.appendChild(a,r);var r=e.createComment("");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom,n=t.hooks,i=n.content;r.detectNamespace(a);var d;t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(d=this.build(r),this.hasRendered?this.cachedFragment=d:this.hasRendered=!0),this.cachedFragment&&(d=r.cloneNode(this.cachedFragment,!0))):d=this.build(r);var c=r.childAt(d,[1]),o=r.createMorphAt(c,1,1),l=r.createMorphAt(c,3,3);return i(t,o,e,"link_flair_text"),i(t,l,e,"title"),d}}}(),a=function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("    ");e.appendChild(t,a);var a=e.createElement("h3"),r=e.createComment("");e.appendChild(a,r);var r=e.createTextNode(" (Pending)");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom,n=t.hooks,i=n.content;r.detectNamespace(a);var d;t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(d=this.build(r),this.hasRendered?this.cachedFragment=d:this.hasRendered=!0),this.cachedFragment&&(d=r.cloneNode(this.cachedFragment,!0))):d=this.build(r);var c=r.createMorphAt(r.childAt(d,[1]),0,0);return i(t,c,e,"title"),d}}}(),r=function(){return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createTextNode("    * /u/");e.appendChild(t,a);var a=e.createComment("");e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(e,t,a){var r=t.dom,n=t.hooks,i=n.content;r.detectNamespace(a);var d;t.useFragmentCache&&r.canClone?(null===this.cachedFragment&&(d=this.build(r),this.hasRendered?this.cachedFragment=d:this.hasRendered=!0),this.cachedFragment&&(d=r.cloneNode(this.cachedFragment,!0))):d=this.build(r);var c=r.createMorphAt(d,1,1,a);return i(t,c,e,"name"),d}}}();return{isHTMLBars:!0,revision:"Ember@1.11.0",blockParams:0,cachedFragment:null,hasRendered:!1,build:function(e){var t=e.createDocumentFragment(),a=e.createElement("div");e.setAttribute(a,"class","row");var r=e.createTextNode("\n  ");e.appendChild(a,r);var r=e.createElement("div");e.setAttribute(r,"class","col-md-4");var n=e.createTextNode("\n    ");e.appendChild(r,n);var n=e.createElement("h3"),i=e.createTextNode("FairShare = ");e.appendChild(n,i);var i=e.createComment("");e.appendChild(n,i);var i=e.createTextNode(" satoshi");e.appendChild(n,i),e.appendChild(r,n);var n=e.createTextNode("\n    ");e.appendChild(r,n);var n=e.createElement("form"),i=e.createTextNode("\n      ");e.appendChild(n,i);var i=e.createElement("div");e.setAttribute(i,"class","form-group");var d=e.createTextNode("\n        ");e.appendChild(i,d);var d=e.createElement("label"),c=e.createTextNode("Pool Size");e.appendChild(d,c),e.appendChild(i,d);var d=e.createTextNode("\n        ");e.appendChild(i,d);var d=e.createComment("");e.appendChild(i,d);var d=e.createTextNode("\n      ");e.appendChild(i,d),e.appendChild(n,i);var i=e.createTextNode("\n      ");e.appendChild(n,i);var i=e.createElement("div");e.setAttribute(i,"class","form-group");var d=e.createTextNode("\n        ");e.appendChild(i,d);var d=e.createElement("label"),c=e.createTextNode("Percentage");e.appendChild(d,c),e.appendChild(i,d);var d=e.createTextNode("\n        ");e.appendChild(i,d);var d=e.createComment("");e.appendChild(i,d);var d=e.createTextNode("\n      ");e.appendChild(i,d),e.appendChild(n,i);var i=e.createTextNode("\n      ");e.appendChild(n,i);var i=e.createElement("div");e.setAttribute(i,"class","form-group");var d=e.createTextNode("\n        ");e.appendChild(i,d);var d=e.createElement("label"),c=e.createTextNode("Beneficiaries");e.appendChild(d,c),e.appendChild(i,d);var d=e.createTextNode("\n        ");e.appendChild(i,d);var d=e.createComment("");e.appendChild(i,d);var d=e.createTextNode("\n      ");e.appendChild(i,d),e.appendChild(n,i);var i=e.createTextNode("\n    ");e.appendChild(n,i),e.appendChild(r,n);var n=e.createTextNode("\n    ");e.appendChild(r,n);var n=e.createElement("hr");e.appendChild(r,n);var n=e.createTextNode("\n    ");e.appendChild(r,n);var n=e.createElement("ul");e.setAttribute(n,"class","media-list");var i=e.createTextNode("\n");e.appendChild(n,i);var i=e.createComment("");

e.appendChild(n,i);var i=e.createTextNode("    ");e.appendChild(n,i),e.appendChild(r,n);var n=e.createTextNode("\n  ");e.appendChild(r,n),e.appendChild(a,r);var r=e.createTextNode("\n    ");e.appendChild(a,r);var r=e.createElement("div");e.setAttribute(r,"class","col-md-8");var n=e.createTextNode("\n");e.appendChild(r,n);var n=e.createComment("");e.appendChild(r,n);var n=e.createTextNode("\n  ");e.appendChild(r,n);var n=e.createElement("pre"),i=e.createTextNode("# UBI Pool: ");e.appendChild(n,i);var i=e.createComment("");e.appendChild(n,i);var i=e.createTextNode(" satoshi\n  ## Today's Total Distribution: ");e.appendChild(n,i);var i=e.createComment("");e.appendChild(n,i);var i=e.createTextNode(" satoshi\n  # ");e.appendChild(n,i);var i=e.createComment("");e.appendChild(n,i);var i=e.createTextNode(" Beneficiares\n");e.appendChild(n,i);var i=e.createComment("");e.appendChild(n,i);var i=e.createTextNode("  # FairShare = ");e.appendChild(n,i);var i=e.createComment("");e.appendChild(n,i);var i=e.createTextNode(" satoshi\n  ");e.appendChild(n,i),e.appendChild(r,n);var n=e.createTextNode("\n    ");e.appendChild(r,n),e.appendChild(a,r);var r=e.createTextNode("\n\n");e.appendChild(a,r),e.appendChild(t,a);var a=e.createTextNode("\n");return e.appendChild(t,a),t},render:function(n,i,d){var c=i.dom,o=i.hooks,l=o.content,s=o.get,h=o.inline,p=o.block;c.detectNamespace(d);var u;i.useFragmentCache&&c.canClone?(null===this.cachedFragment&&(u=this.build(c),this.hasRendered?this.cachedFragment=u:this.hasRendered=!0),this.cachedFragment&&(u=c.cloneNode(this.cachedFragment,!0))):u=this.build(c);var m=c.childAt(u,[0]),f=c.childAt(m,[1]),v=c.childAt(f,[3]),C=c.childAt(m,[3]),g=c.childAt(C,[3]),b=c.createMorphAt(c.childAt(f,[1]),1,1),x=c.createMorphAt(c.childAt(v,[1]),3,3),N=c.createMorphAt(c.childAt(v,[3]),3,3),T=c.createMorphAt(c.childAt(v,[5]),3,3),F=c.createMorphAt(c.childAt(f,[7]),1,1),A=c.createMorphAt(C,1,1),E=c.createMorphAt(g,1,1),y=c.createMorphAt(g,3,3),R=c.createMorphAt(g,5,5),M=c.createMorphAt(g,7,7),w=c.createMorphAt(g,9,9);return l(i,b,n,"fairShare"),h(i,x,n,"input",[],{value:s(i,n,"ubiPool"),"class":"form-control"}),h(i,N,n,"input",[],{value:s(i,n,"percentage"),"class":"form-control"}),h(i,T,n,"input",[],{value:s(i,n,"beneficiaryCount"),"class":"form-control"}),p(i,F,n,"each",[s(i,n,"comments")],{},e,null),p(i,A,n,"if",[s(i,n,"link_flair_text")],{},t,a),l(i,E,n,"ubiPool"),l(i,y,n,"total"),l(i,R,n,"beneficiaryCount"),p(i,M,n,"each",[s(i,n,"beneficiaries")],{keyword:"name"},r,null),l(i,w,n,"fairShare"),u}}}())}),define("fairshare-site/config/environment",["ember"],function(e){var t="fairshare-site";try{var a=t+"/config/environment",r=e["default"].$('meta[name="'+a+'"]').attr("content"),n=JSON.parse(unescape(r));return{"default":n}}catch(i){throw new Error('Could not read config from meta tag with name "'+a+'".')}}),runningTests?require("fairshare-site/tests/test-helper"):require("fairshare-site/app")["default"].create({name:"fairshare-site",version:"0.0.0.f0ef4b21"});