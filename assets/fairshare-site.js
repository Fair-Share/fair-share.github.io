/* jshint ignore:start */

/* jshint ignore:end */

define('fairshare-site/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'fairshare-site/config/environment'], function (exports, Ember, Resolver, loadInitializers, config) {

  'use strict';

  Ember['default'].MODEL_FACTORY_INJECTIONS = true;

  var App = Ember['default'].Application.extend({
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix,
    Resolver: Resolver['default']
  });

  loadInitializers['default'](App, config['default'].modulePrefix);

  exports['default'] = App;

});
define('fairshare-site/client', ['exports', 'fairshare-site/config/environment'], function (exports, config) {

  'use strict';

  /* globals Snoocore */
  exports['default'] = window.reddit = new Snoocore({
    userAgent: "FairShare 0.0.1 by go1dfish",
    decodeHtmlEntities: true,
    oauth: {
      type: "implicit",
      mobile: false,
      duration: "temporary",
      consumerKey: config['default'].consumerKey,
      redirectUri: config['default'].redirectUrl,
      scope: [
      //'account',
      //'creddits',
      "edit",
      //'history',
      //'modflair',
      //'modlog',
      //'modothers',
      //'modposts',
      //'modself',
      //'modwiki',
      //'mysubreddits',
      //'report',
      //'save',
      "submit", "subscribe", "vote",
      //'wikiedit',
      //'wikiread',
      "read", "identity"]
    }
  });

});
define('fairshare-site/components/growl-instance', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    classNames: ["growl-instance"],
    classNameBindings: ["type"],
    type: (function () {
      return this.get("notification.options.type");
    }).property(),
    click: function click() {
      this.destroyAlert();
    },
    didInsertElement: function didInsertElement() {
      if (this.get("notification.options.fadeIn")) {
        this.$().hide().fadeIn();
      }

      if (this.get("notification.options.twitch")) {
        var el = this.$(),
            maxDegree = 1,
            negative;
        var interval = window.setInterval(function () {
          negative = negative ? "" : "-";
          el.css("transform", "rotate(" + negative + maxDegree + "deg)");
        }, 75);
        Ember['default'].run.later(function () {
          el.css("transform", "rotate(0deg)");
          window.clearInterval(interval);
        }, 400);
      }

      // unless a click-to-dismiss is required we auto close
      if (!this.get("notification.options.clickToDismiss")) {
        Ember['default'].run.later(this, this.destroyAlert, this.get("notification.options.closeIn"));
      }
    },
    destroyAlert: function destroyAlert() {
      var self = this;
      if (this.$()) {
        this.$().fadeOut(Ember['default'].run(this, function () {
          // send the action on up so the manager can remove this item from array
          self.sendAction("action", self.get("notification"));
        }));
      } else {
        self.sendAction("action", self.get("notification"));
      }
    },
    actions: {
      dismiss: function dismiss() {
        // a close button has been clicked
        this.destroyAlert();
      }
    }
  });

});
define('fairshare-site/components/growl-manager', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    classNames: ["growl-manager"],
    actions: {
      dismiss: function dismiss(notification) {
        this.get("notifications").removeObject(notification);
      }
    }
  });

});
define('fairshare-site/controllers/application', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    queryParams: ["access_token"],
    user: Ember['default'].computed.alias("model"),
    loginUrl: (function () {
      return client['default'].getImplicitAuthUrl();
    }).property("user"),
    loginExpiry: (function () {
      return this.get("loginExpires");
    }).property("loginExpires", "timeupdater.currentMoment"),
    updateUserData: (function () {
      if (!this.get("user")) {
        return;
      }
      client['default']("/api/v1/me").get().then((function (user) {
        this.set("user", user);
      }).bind(this))["catch"]((function () {
        this.growl.alert(["<div class=\"message\">Logged out</div>"].join("\n"), { clickToDismiss: true });
        this.set("user", null);
      }).bind(this));
    }).observes("timeupdater.currentMoment")
  });

});
define('fairshare-site/controllers/login', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    needs: ["application"],
    loginUrl: Ember['default'].computed.alias("controllers.application.loginUrl")
  });

});
define('fairshare-site/controllers/ubi', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].ObjectController.extend({
    ubiPool: 30000000,
    percentage: 10,
    total: (function () {
      return parseInt(parseInt(this.get("ubiPool")) * (this.get("percentage") / 100));
    }).property("ubiPool", "ratio"),
    fairShare: (function () {
      var count = this.get("beneficiaries.length");
      if (!count) {
        return this.get("total");
      };
      return Math.floor(this.get("total") / count);
    }).property("beneficiaries.length", "total")
  });

});
define('fairshare-site/initializers/app-version', ['exports', 'fairshare-site/config/environment', 'ember'], function (exports, config, Ember) {

  'use strict';

  var classify = Ember['default'].String.classify;
  var registered = false;

  exports['default'] = {
    name: "App Version",
    initialize: function initialize(container, application) {
      if (!registered) {
        var appName = classify(application.toString());
        Ember['default'].libraries.register(appName, config['default'].APP.version);
        registered = true;
      }
    }
  };

});
define('fairshare-site/initializers/ember-cli-dates', ['exports', 'ember', 'ember-cli-dates/helpers/time-format', 'ember-cli-dates/helpers/time-ago-in-words', 'ember-cli-dates/helpers/day-of-the-week', 'ember-cli-dates/helpers/time-ahead-in-words', 'ember-cli-dates/helpers/time-delta-in-words', 'ember-cli-dates/helpers/month-and-year', 'ember-cli-dates/helpers/month-and-day', 'ember-cli-dates/helpers/date-and-time'], function (exports, Ember, time_format, time_ago_in_words, day_of_the_week, time_ahead_in_words, time_delta_in_words, month_and_year, month_and_day, date_and_time) {

  'use strict';

  var initialize = function initialize() {
    Ember['default'].Handlebars.helper("time-format", time_format.timeFormat);
    Ember['default'].Handlebars.helper("time-ago-in-words", time_ago_in_words.timeAgoInWords);
    Ember['default'].Handlebars.helper("day-of-the-week", day_of_the_week.dayOfTheWeek);
    Ember['default'].Handlebars.helper("time-ahead-in-words", time_ahead_in_words.timeAheadInWords);
    Ember['default'].Handlebars.helper("time-delta-in-words", time_delta_in_words.timeDeltaInWords);
    Ember['default'].Handlebars.helper("month-and-year", month_and_year.monthAndYear);
    Ember['default'].Handlebars.helper("month-and-day", month_and_day.monthAndDay);
    Ember['default'].Handlebars.helper("date-and-time", date_and_time.dateAndTime);
  };

  exports['default'] = {
    name: "ember-cli-dates",
    initialize: initialize
  };
  /* container, app */

  exports.initialize = initialize;

});
define('fairshare-site/initializers/export-application-global', ['exports', 'ember', 'fairshare-site/config/environment'], function (exports, Ember, config) {

  'use strict';

  exports.initialize = initialize;

  function initialize(container, application) {
    var classifiedName = Ember['default'].String.classify(config['default'].modulePrefix);

    if (config['default'].exportApplicationGlobal && !window[classifiedName]) {
      window[classifiedName] = application;
    }
  }

  ;

  exports['default'] = {
    name: "export-application-global",

    initialize: initialize
  };

});
define('fairshare-site/initializers/growl', ['exports', 'fairshare-site/services/growl'], function (exports, Growl) {

  'use strict';

  exports['default'] = {
    name: "growl",
    initialize: function initialize(container, app) {
      Growl['default'].reopenClass({
        container: container
      });

      app.register("growl:main", Growl['default']);
      app.inject("route", "growl", "growl:main");
      app.inject("controller", "growl", "growl:main");
    }
  };

});
define('fairshare-site/router', ['exports', 'ember', 'fairshare-site/config/environment'], function (exports, Ember, config) {

  'use strict';

  var Router = Ember['default'].Router.extend({
    location: config['default'].locationType
  });

  exports['default'] = Router.map(function () {
    this.route("ubi");
  });

});
define('fairshare-site/routes/application', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  /* globals moment,window */
  function getParamByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.hash.replace(/^#/, "?"));
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  exports['default'] = Ember['default'].Route.extend({
    model: function model() {
      var code = getParamByName("access_token");
      if (code) {
        this.controllerFor("application").set("loginExpires", moment().add(parseInt(getParamByName("expires_in")), "second"));

        window.location.hash = "";
        return client['default'].auth(code).then(function () {
          return client['default']("/api/v1/me").get();
        }).then((function (res) {
          this.growl.info(["<h1>Logged in as", res.name, "</h1>", "<div class=\"message\">", "V for reddit will now poll for new (mod) mail", "</div>"].join("\n"));
          return res;
        }).bind(this));
      }
      this.growl.info(["<h1>Welcome to <em>V for reddit</em></h1><div class=\"message\">", "<p>This is still an early and incomplete alpha!</p></div>"].join("\n"), {
        closeIn: 6000
      });
    },

    redirect: function redirect(model) {
      return this.transitionTo("ubi");
    },

    actions: {
      logout: function logout() {
        client['default'].deauth().then((function () {
          this.controllerFor("application").set("user", null);
        }).bind(this))["catch"](function (e) {
          console.error(e.stack || e);
          alert("Logout is broken due to a Snoocore bug, but if you refresh I forget your token.  So I'll do that now");
          window.location.reload();
        });
      }
    }
  });

});
define('fairshare-site/routes/ubi', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model() {
      return client['default']("/r/GetFairShare/new").get().then(function (result) {
        return result.data.children;
      }).then(function (posts) {
        var post = posts.find(function (post) {
          console.log("1", post);
          return post.data.title.match(/Prototype Distribution/);
        });
        if (post) {
          return post.data;
        };
      }).then(function (post) {
        return client['default']("/r/GetFairShare/comments/" + post.id + ".json").get().then(function (result) {
          post.comments = result[1].data.children.getEach("data");
          post.beneficiaries = post.comments.getEach("author").uniq().without("PoliticBot");
          return post;
        });
      });
    }
  });

});
define('fairshare-site/services/growl', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Object.extend({
    notifications: Ember['default'].A(),
    error: function error(context, opts) {
      opts = opts || {};
      opts.type = "error";
      this._notify.call(this, context, opts);
    },
    alert: function alert(context, opts) {
      opts = opts || {};
      opts.type = "alert";
      this._notify.call(this, context, opts);
    },
    info: function info(context, opts) {
      opts = opts || {};
      opts.type = "info";
      this._notify.call(this, context, opts);
    },

    _notify: function _notify(context, opts) {
      // default options
      var options = {
        type: "error",
        fadeIn: true,
        closeIn: 5000, // automatically close in 5 seconds.
        clickToDismiss: false, // stay open until it receives a click?
        twitch: false
      };

      Ember['default'].merge(options, opts);

      // if the developer passed an identical message then we just update
      // the open notification balloon options
      var existing = this.get("notifications").findBy("content", context);
      if (existing) {
        return;
      }

      var notification = Ember['default'].ObjectProxy.extend({
        // {{notification.content}} for a string or {{notification.foo}} if you
        // pass an object from a route via this.growl.error({foo: 'bar'});
        content: context,
        options: options,
        updated: 0,
        isInfo: (function () {
          return options.type === "info";
        }).property(),
        isAlert: (function () {
          return options.type === "alert";
        }).property(),
        isError: (function () {
          return options.type === "error";
        }).property()
      }).create();

      this.get("notifications").pushObject(notification);
    }
  });

});
define('fairshare-site/templates/application', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("button");
          var el2 = dom.createTextNode("Logged in as: ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, element = hooks.element, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element1 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(element1,1,1);
          element(env, element1, context, "action", ["logout"], {});
          content(env, morph0, context, "user.name");
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("a");
          dom.setAttribute(el1,"title","Login");
          var el2 = dom.createElement("button");
          var el3 = dom.createTextNode("(Optional) Login at reddit.com");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, element = hooks.element;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [0]);
          element(env, element0, context, "bind-attr", [], {"href": get(env, context, "loginUrl")});
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h1");
        dom.setAttribute(el1,"id","title");
        var el2 = dom.createTextNode("FairShare");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,2,2,contextualElement);
        var morph1 = dom.createMorphAt(fragment,4,4,contextualElement);
        block(env, morph0, context, "if", [get(env, context, "user")], {}, child0, child1);
        content(env, morph1, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/components/growl-instance', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("img");
          dom.setAttribute(el1,"src","../img/error.svg");
          dom.setAttribute(el1,"alt","Error");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("img");
          dom.setAttribute(el1,"src","../img/alert.svg");
          dom.setAttribute(el1,"alt","Alert");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("img");
          dom.setAttribute(el1,"src","../img/info.svg");
          dom.setAttribute(el1,"alt","Info");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h1");
          var el2 = dom.createTextNode("Uh oh.");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    var child4 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h1");
          var el2 = dom.createTextNode("Attention!");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    var child5 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h1");
          var el2 = dom.createTextNode("Hey!");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","message-area");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","message");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [7]);
        var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
        var morph1 = dom.createMorphAt(fragment,3,3,contextualElement);
        var morph2 = dom.createMorphAt(fragment,5,5,contextualElement);
        var morph3 = dom.createMorphAt(element0,1,1);
        var morph4 = dom.createMorphAt(element0,3,3);
        var morph5 = dom.createMorphAt(element0,5,5);
        var morph6 = dom.createUnsafeMorphAt(dom.childAt(element0, [7]),1,1);
        block(env, morph0, context, "unboundIf", [get(env, context, "notification.isError")], {}, child0, null);
        block(env, morph1, context, "unboundIf", [get(env, context, "notification.isAlert")], {}, child1, null);
        block(env, morph2, context, "unboundIf", [get(env, context, "notification.isInfo")], {}, child2, null);
        block(env, morph3, context, "unboundIf", [get(env, context, "notification.isError")], {}, child3, null);
        block(env, morph4, context, "unboundIf", [get(env, context, "notification.isAlert")], {}, child4, null);
        block(env, morph5, context, "unboundIf", [get(env, context, "notification.isInfo")], {}, child5, null);
        content(env, morph6, context, "notification.content");
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/components/growl-manager', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          inline(env, morph0, context, "growl-instance", [], {"action": "dismiss", "notification": get(env, context, "notification")});
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
        dom.insertBoundary(fragment, null);
        block(env, morph0, context, "each", [get(env, context, "notifications")], {"keyword": "notification"}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/index', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        var el2 = dom.createTextNode("Homepage");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/loading', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h3");
        dom.setAttribute(el1,"class","loading");
        var el2 = dom.createTextNode("Loading...");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/login', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"title","Login");
        var el2 = dom.createTextNode("Login at reddit.com");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, element = hooks.element;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        element(env, element0, context, "bind-attr", [], {"href": get(env, context, "loginUrl")});
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/ubi', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  * /u/");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          content(env, morph0, context, "name");
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        var el2 = dom.createTextNode("Universal Basic Income");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("label");
        var el2 = dom.createTextNode("Pool Size (satoshis) ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("label");
        var el2 = dom.createTextNode("Disbursement % ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h3");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("pre");
        var el2 = dom.createTextNode("\n# UBI Pool: ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" satoshi\n\n## Today's Total Distribution: ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" satoshi\n\n# ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" Beneficiares\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n# FairShare = ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" satoshi\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline, content = hooks.content, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [8]);
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(fragment, [4]),1,1);
        var morph2 = dom.createMorphAt(dom.childAt(fragment, [6]),0,0);
        var morph3 = dom.createMorphAt(element0,1,1);
        var morph4 = dom.createMorphAt(element0,3,3);
        var morph5 = dom.createMorphAt(element0,5,5);
        var morph6 = dom.createMorphAt(element0,7,7);
        var morph7 = dom.createMorphAt(element0,9,9);
        inline(env, morph0, context, "input", [], {"value": get(env, context, "ubiPool")});
        inline(env, morph1, context, "input", [], {"value": get(env, context, "percentage")});
        content(env, morph2, context, "title");
        content(env, morph3, context, "ubiPool");
        content(env, morph4, context, "total");
        content(env, morph5, context, "beneficiaries.length");
        block(env, morph6, context, "each", [get(env, context, "beneficiaries")], {"keyword": "name"}, child0, null);
        content(env, morph7, context, "fairShare");
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/tests/app.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('app.js should pass jshint', function() { 
    ok(true, 'app.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/client.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('client.js should pass jshint', function() { 
    ok(true, 'client.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/controllers/application.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/application.js should pass jshint', function() { 
    ok(true, 'controllers/application.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/controllers/login.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/login.js should pass jshint', function() { 
    ok(true, 'controllers/login.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/controllers/ubi.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/ubi.js should pass jshint', function() { 
    ok(false, 'controllers/ubi.js should pass jshint.\ncontrollers/ubi.js: line 11, col 42, Missing semicolon.\ncontrollers/ubi.js: line 11, col 43, Unnecessary semicolon.\n\n2 errors'); 
  });

});
define('fairshare-site/tests/helpers/resolver', ['exports', 'ember/resolver', 'fairshare-site/config/environment'], function (exports, Resolver, config) {

  'use strict';

  var resolver = Resolver['default'].create();

  resolver.namespace = {
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix
  };

  exports['default'] = resolver;

});
define('fairshare-site/tests/helpers/resolver.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/resolver.js should pass jshint', function() { 
    ok(true, 'helpers/resolver.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/helpers/start-app', ['exports', 'ember', 'fairshare-site/app', 'fairshare-site/router', 'fairshare-site/config/environment'], function (exports, Ember, Application, Router, config) {

  'use strict';



  exports['default'] = startApp;
  function startApp(attrs) {
    var application;

    var attributes = Ember['default'].merge({}, config['default'].APP);
    attributes = Ember['default'].merge(attributes, attrs); // use defaults, but you can override;

    Ember['default'].run(function () {
      application = Application['default'].create(attributes);
      application.setupForTesting();
      application.injectTestHelpers();
    });

    return application;
  }

});
define('fairshare-site/tests/helpers/start-app.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/start-app.js should pass jshint', function() { 
    ok(true, 'helpers/start-app.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/router.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('router.js should pass jshint', function() { 
    ok(true, 'router.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/routes/application.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/application.js should pass jshint', function() { 
    ok(false, 'routes/application.js should pass jshint.\nroutes/application.js: line 42, col 22, \'model\' is defined but never used.\n\n1 error'); 
  });

});
define('fairshare-site/tests/routes/ubi.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/ubi.js should pass jshint', function() { 
    ok(false, 'routes/ubi.js should pass jshint.\nroutes/ubi.js: line 13, col 34, Missing semicolon.\nroutes/ubi.js: line 13, col 35, Unnecessary semicolon.\n\n2 errors'); 
  });

});
define('fairshare-site/tests/test-helper', ['fairshare-site/tests/helpers/resolver', 'ember-qunit'], function (resolver, ember_qunit) {

	'use strict';

	ember_qunit.setResolver(resolver['default']);

});
define('fairshare-site/tests/test-helper.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('test-helper.js should pass jshint', function() { 
    ok(true, 'test-helper.js should pass jshint.'); 
  });

});
/* jshint ignore:start */

/* jshint ignore:end */

/* jshint ignore:start */

define('fairshare-site/config/environment', ['ember'], function(Ember) {
  var prefix = 'fairshare-site';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (runningTests) {
  require("fairshare-site/tests/test-helper");
} else {
  require("fairshare-site/app")["default"].create({"name":"fairshare-site","version":"0.0.0.99227210"});
}

/* jshint ignore:end */
//# sourceMappingURL=fairshare-site.map