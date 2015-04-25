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
      //'edit',
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
      "submit",
      //'subscribe',
      //'vote',
      //'wikiedit',
      //'read',
      "identity"]
    }
  });

});
define('fairshare-site/components/display-comment', ['exports', 'ember', 'fairshare-site/mixins/comment'], function (exports, Ember, CommentMixin) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend(CommentMixin['default'], {
    classNames: ["media-body"]
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
define('fairshare-site/components/link-entry', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    classNames: ["media"],
    thumbnail: (function () {
      var thumb = this.get("item.thumbnail");
      if (["default", "self"].contains(thumb)) {
        return;
      }
      return thumb;
    }).property("item.thumbnail")
  });

});
define('fairshare-site/components/qr-code', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  /* globals QRCode */
  exports['default'] = Ember['default'].Component.extend({
    classNames: ["qr-code"],
    value: "",

    qrCode: (function () {
      return new QRCode(this.get("element"), this.get("value"));
    }).property(),

    drawCode: (function () {
      this.get("qrCode");
    }).on("didInsertElement")
  });

});
define('fairshare-site/components/send-btc', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  /* globals QRCode */
  exports['default'] = Ember['default'].Component.extend({
    auth: Ember['default'].inject.service(),
    bitcore: Ember['default'].inject.service(),
    amount: "",
    dest: "",

    placeholder: (function (key, value) {
      if (arguments.length > 1) {
        return value;
      }
      var balance = this.get("auth.balance");
      if (!balance) {
        return "No balance available!";
      }
      return balance + " satoshi available";
    }).property("auth.balance"),

    isValid: (function () {
      var amount = parseInt(this.get("amount"));
      var dest = this.get("dest") || "";
      if (!amount) {
        return false;
      }
      if (amount > this.get("auth.balance")) {
        return false;
      }
      return this.get("bitcore").Address.isValid(dest);
    }).property("amount", "dest"),

    actions: {
      send: function send() {
        var dest = this.get("dest");
        var amount = parseInt(this.get("amount"));
        if (!dest || !amount) {
          return;
        }
        if (!confirm("Are you sure?")) {
          return;
        }
        this.get("auth").sendBtc(dest, amount).then((function () {
          this.setProperties({
            placeholder: "Sent " + amount + " satoshi",
            amount: ""
          });
        }).bind(this));
      }
    }

  });

});
define('fairshare-site/components/sign-comment', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  /* globals moment */
  exports['default'] = Ember['default'].Component.extend({
    auth: Ember['default'].inject.service(),
    bitcore: Ember['default'].inject.service(),
    user: Ember['default'].computed.alias("auth.user"),
    message: "",
    buttonText: "comment",
    statusMessage: "Commenting...",
    address: Ember['default'].computed.alias("auth.publicKey"),
    username: Ember['default'].computed.alias("auth.username"),
    markdown: Ember['default'].computed.alias("signed.markdown"),
    signature: Ember['default'].computed.alias("signed.signature"),

    signed: (function () {
      return this.get("auth").signMessage(this.get("message"));
    }).property("address", "message"),

    actions: {
      makeComment: function makeComment() {
        if (this.get("isCommenting")) {
          return;
        }
        var markdown = this.get("markdown");
        var comments = this.get("comments") || [];
        if (!markdown) {
          return;
        }
        var thingId = this.get("thingId");
        if (!thingId) {
          return;
        }
        if (!this.get("user.name")) {
          return;
        }
        this.set("isCommenting", true);
        return client['default']("/api/comment").post({
          api_type: "json",
          thing_id: thingId,
          text: markdown
        }).then(function (data) {
          var comment = data.json.data.things[0].data;
          comments.insertAt(0, comment);
        }, function (error) {
          console.error(error);
          alert("Error making comment", error);
        })["finally"]((function () {
          this.set("isCommenting", false);
        }).bind(this));
      }
    }
  });

});
define('fairshare-site/controllers/application', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    queryParams: ["access_token"],
    auth: Ember['default'].inject.service(),
    loginUrl: Ember['default'].computed.alias("auth.loginUrl"),
    user: Ember['default'].computed.alias("auth.user"),
    didChangeModel: (function () {
      this.set("auth.user", this.get("model"));
    }).observes("model").on("init")
  });

});
define('fairshare-site/controllers/comments/chain', ['exports', 'ember', 'fairshare-site/mixins/comment'], function (exports, Ember, CommentMixin) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    auth: Ember['default'].inject.service(),
    bitcore: Ember['default'].inject.service(),
    user: Ember['default'].computed.alias("auth.user"),

    percentage: 10,

    isDistributing: (function () {
      return this.get("escrow.address") === this.get("auth.addressString");
    }).property("escrow.address", "auth.addressString"),

    totalDistribution: (function () {
      return Math.floor(parseInt(this.get("percentage")) / 100 * this.get("balance"));
    }).property("percentage", "balance"),

    balance: (function () {
      var balance = 0;
      this.get("unspent").forEach(function (tx) {
        balance += tx.satoshis;
      });
      return balance;
    }).property("escrow.balance"),

    unspent: Ember['default'].computed.map("escrow.unspent", function (tx) {
      return this.get("bitcore").unspentOutput({
        txid: tx.txid,
        satoshis: tx.value,
        vout: tx.output_no,
        script: tx.script_hex
      });
    }),

    toSpend: (function () {
      var unspent = this.get("unspent").sortBy("satoshis");
      var toSpend = [];
      var amount = 0;
      var needed = this.get("totalDistribution");
      var bigTxs = unspent.filter(function (tx) {
        return tx.satoshis > needed;
      });
      var tx;
      if (bigTxs.length) {
        return [bigTxs[0]];
      }
      while (amount < needed) {
        tx = unspent.popObject();
        amount += tx.satoshis;
        toSpend.pushObject(tx);
      }
      return toSpend;
    }).property("unspent.@each.satoshis"),

    totalInputs: (function () {
      var inputs = 0;
      (this.get("transactionObj.inputs") || []).forEach(function (input) {
        inputs += input.output.satoshis;
      });
      return inputs;
    }).property("transactionObj.inputs.@each.output.satoshis"),

    totalOutputs: (function () {
      var outputs = 0;
      (this.get("transactionObj.outputs") || []).forEach(function (output) {
        outputs += output.satoshis;
      });
      return outputs;
    }).property("transactionObj.outputs.@each.satoshis"),

    fairShare: (function () {
      return Math.floor(this.get("totalDistribution") / this.get("uniqueSignatures.length"));
    }).property("totalDistribution", "uniqueSignatures.length"),

    commentItems: Ember['default'].computed.map("model.comments", function (comment) {
      return Ember['default'].Object.createWithMixins(CommentMixin['default'], {
        comment: comment,
        container: this.get("container")
      });
    }),

    signedItems: Ember['default'].computed.filterProperty("commentItems", "isSigned", true),

    rawSignatories: Ember['default'].computed.mapBy("signedItems", "comment.author"),
    signatories: Ember['default'].computed.uniq("rawSignatories"),
    uniqueSignatures: Ember['default'].computed.map("signatories", function (username) {
      return this.get("signedItems").findProperty("comment.author", username);
    }),

    transaction: (function () {
      var transaction = this.get("bitcore").transaction();
      var fairShare = this.get("fairShare");
      transaction.from(this.get("toSpend"));
      this.get("uniqueSignatures").forEach(function (item) {
        transaction.to(item.get("address"), fairShare);
      });
      transaction.change(this.get("escrow.address"));
      return transaction;
    }).property("uniqueSignatures.@each", "toSpend.@each", "fairShare", "auth.privateKey", "isAuthorized"),

    minerFee: (function () {
      return this.get("transaction").getFee();
    }).property("transaction"),

    change: (function () {
      return this.get("totalOutputs") - this.get("minerFee") - this.get("totalDistribution");
    }).property("minerFee", "totalOutputs", "totalDistribution"),

    transactionObj: (function () {
      var transaction = this.get("transaction");
      if (!transaction) {
        return;
      }
      var obj = transaction.toObject();
      return obj;
    }).property("transaction"),

    transactionString: (function () {
      var transaction = this.get("transaction");
      if (!transaction) {
        return;
      }
      return transaction.toString();
    }).property("transaction"),

    transactionJsonString: (function () {
      return JSON.stringify(this.get("transactionObj"), null, 1);
    }).property("transactionObj")
  });

});
define('fairshare-site/controllers/comments/ubi', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].ObjectController.extend({
    needs: ["subreddit"],
    subreddit: Ember['default'].computed.alias("controllers.subreddit.model"),
    auth: Ember['default'].inject.service(),
    user: Ember['default'].computed.alias("auth.user"),
    coins: Ember['default'].computed.alias("controllers.subreddit.model.escrows"),

    distComments: (function () {
      return [];
    }).property("model"),

    _totals: (function () {
      var post = this.get("model");

      return (this.get("coins") || []).map(function (coin) {
        var val = parseFloat(post.prices[coin.unit]) * coin.count;
        var ratio = parseInt(coin.percentage) / 100;

        return {
          coin: coin,
          value: val.toFixed(4),
          usdValue: (parseFloat(post.prices.btc) * val).toFixed(2),
          amount: Math.floor(coin.count * ratio)
        };
      });
    }).property("coins.@each.{count,percentage}"),

    totalsSort: ["value:desc"],
    totals: Ember['default'].computed.sort("_totals", "totalsSort"),

    collectiveTotal: (function () {
      var btcValue = 0;
      var usdValue = 0;
      this.get("totals").forEach(function (total) {
        btcValue += parseFloat(total.value);
        usdValue += parseFloat(total.usdValue);
      });
      return {
        btc: btcValue.toFixed(4),
        usd: usdValue.toFixed(2)
      };
    }).property("totals.@each.value", "totals.@each.usdValue"),

    shareTotal: (function () {
      var post = this.get("model");
      var btcValue = 0;
      var usdValue = 0;
      this.get("shares").forEach(function (share) {
        var btc = parseFloat(post.prices[share.coin.unit]) * share.amount;
        var usd = parseFloat(post.prices.btc) * btc;
        btcValue += btc;
        usdValue += usd;
      });
      return {
        bits: (btcValue * 1000000).toFixed(2),
        usd: usdValue.toFixed(2)
      };
    }).property("shares.@each.total", "model.prices"),

    _shares: (function () {
      var count = this.get("beneficiaryCount");
      return this.get("totals").map(function (total) {
        var amount = Math.floor(total.amount / count);
        return {
          coin: total.coin,
          total: total,
          amount: amount
        };
      });
    }).property("totals.@each.total", "beneficiaryCount"),

    maxCoins: 3,
    shares: (function () {
      return this.get("_shares").slice(0, this.get("maxCoins"));
    }).property("_shares.@each", "maxCoins"),

    beneficiaryCount: (function (key, value) {
      if (value) {
        return parseInt(value);
      }
      return this.get("beneficiaries.length");
    }).property("beneficiaries.length"),

    fairShare: (function () {
      var count = this.get("beneficiaryCount");
      if (!count) {
        return this.get("total");
      };
      return Math.floor(this.get("total") / count);
    }).property("beneficiaryCount", "total"),

    requestComment: (function () {
      return this.get("comments").findProperty("author", this.get("user.name"));
    }).property("user", "comments.@each.author"),

    isDistributing: (function (key, value) {
      if (arguments.length > 1) {
        return value;
      }
      return this.get("model.author") === this.get("user.name");
    }).property("model.author", "user.name")
  });

});
define('fairshare-site/controllers/index', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    auth: Ember['default'].inject.service()
  });

});
define('fairshare-site/controllers/multisig/thread/enroll', ['exports', 'ember', 'fairshare-site/mixins/comment'], function (exports, Ember, CommentMixin) {

  'use strict';

  /* globals bitcore */
  var bitcore = require("bitcore");
  var Message = require("bitcore-message");
  exports['default'] = Ember['default'].Controller.extend({
    needs: ["application"],
    user: Ember['default'].computed.alias("controllers.application.user"),
    percentage: 75,
    maxEnrollment: 16,
    publicKeys: Ember['default'].computed.mapBy("enrolledComments", "publicKey"),

    isEnrolled: (function () {
      var user = this.get("user.name");
      if (!user) {
        return true;
      }
      return !!this.get("comments").findProperty("author", user);
    }).property("user.name", "comments.@each.author"),

    commentItems: Ember['default'].computed.map("model.comments", function (comment) {
      return Ember['default'].Object.createWithMixins(CommentMixin['default'], {
        comment: comment
      });
    }),

    signedCommentItems: Ember['default'].computed.filterProperty("commentItems", "isSigned", true),

    enrolledComments: (function () {
      return this.get("signedCommentItems").slice(0, this.get("maxEnrollment"));
    }).property("signedCommentItems.@each", "maxEnrollment"),

    comments: Ember['default'].computed.mapBy("enrolledComments", "comment"),

    n: (function () {
      if (this.get("comments.length") > 16) {
        return 16;
      }
      return this.get("comments.length");
    }).property("commentItems.length"),

    m: (function () {
      return Math.floor(parseInt(this.get("percentage")) / 100 * this.get("n"));
    }).property("n", "percentage"),

    script: (function () {
      var publicKeys = this.get("publicKeys");
      return bitcore.Script.buildMultisigOut(publicKeys, this.get("m"));
    }).property("publicKeys.@each", "m", "n"),

    scriptString: (function () {
      return this.get("script").toString();
    }).property("script"),

    p2shAddress: (function () {
      return bitcore.Address.payingTo(this.get("script"));
    }).property("script"),

    p2shAddressString: (function () {
      return this.get("p2shAddress").toString();
    }).property("p2shAddress"),

    markdown: (function () {
      return this.get("signedCommentItems").map(function (item) {
        return [" * /u/" + Ember['default'].get(item, "comment.author"), "*" + Ember['default'].get(item, "address") + "*", "[" + Ember['default'].get(item, "signature") + "](/api/info?id=" + item.get("comment.name") + ")"].join(" ");
      }).join("\n");
    }).property("model.title", "enrolledComments.@each"),

    actions: {
      removeComment: function removeComment(comment) {
        this.get("model.comments").removeObject(comment);
      }
    }
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
define('fairshare-site/initializers/ember-moment', ['exports', 'ember-moment/helpers/moment', 'ember-moment/helpers/ago', 'ember-moment/helpers/duration', 'ember'], function (exports, moment, ago, duration, Ember) {

  'use strict';

  var initialize = function initialize() {
    var registerHelper;

    if (Ember['default'].HTMLBars) {
      registerHelper = function (helperName, fn) {
        Ember['default'].HTMLBars._registerHelper(helperName, Ember['default'].HTMLBars.makeBoundHelper(fn));
      };
    } else {
      registerHelper = Ember['default'].Handlebars.helper;
    };

    registerHelper("moment", moment['default']);
    registerHelper("ago", ago['default']);
    registerHelper("duration", duration['default']);
  };

  exports['default'] = {
    name: "ember-moment",

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
define('fairshare-site/mixins/comment', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Mixin.create({
    bitcore: Ember['default'].inject.service(),
    publicKeySelector: "strong:first",
    signatureSelector: "em:last",

    parsedBody: (function () {
      return Ember['default'].$(this.get("comment.body_html"));
    }).property("comment.body_html"),

    message: (function () {
      var lines = (this.get("comment.body") || "").split("\n");
      lines = lines.splice(1);
      lines.pop();
      return lines.join("\n").trim();
    }).property("comment.body"),

    messageHtml: (function () {
      if (!this.get("isSigned")) {
        return this.get("comment.body_html");
      }
      var body = Ember['default'].$(this.get("comment.body_html"));
      Ember['default'].$(body.find(this.get("publicKeySelector")).parent()).remove();
      Ember['default'].$(body.find(this.get("signatureSelector")).parent()).remove();
      return "<div class=\"md\">" + body.html() + "</div>";
    }).property("comment.body_html", "isSigned"),

    plaintext: (function () {
      return this.get("bitcore").normalizeMarkdown(this.get("message"));
    }).property("message"),

    address: (function () {
      var text = this.get("parsedBody").find(this.get("publicKeySelector")).text().trim();
      if (this.get("bitcore").Address.isValid(text)) {
        return this.get("bitcore").address(text);
      }
      if (!text) {
        return;
      }
      return this.get("bitcore").publicKey(text).toAddress();
    }).property("parsedBody"),

    addressString: (function () {
      var address = this.get("address");
      if (!address) {
        return;
      }
      return address.toString();
    }).property("address"),

    isSigned: (function () {
      if (!this.get("address") || !this.get("signature")) {
        return;
      }
      return this.get("bitcore").verifySignature(this.get("plaintext"), this.get("address"), this.get("signature"));
    }).property("plaintext", "signature", "address"),

    signature: (function () {
      return this.get("parsedBody").find(this.get("signatureSelector")).text();
    }).property("parsedBody")
  });

});
define('fairshare-site/router', ['exports', 'ember', 'fairshare-site/config/environment'], function (exports, Ember, config) {

  'use strict';

  var Router = Ember['default'].Router.extend({
    location: config['default'].locationType
  });

  exports['default'] = Router.map(function () {
    this.resource("ubi", function () {
      this.route("thread", { path: "/:thread_id" });
    });
    this.resource("multisig", function () {
      this.route("thread", { path: "/:thread_id" }, function () {
        this.route("enroll");
      });
    });
    this.resource("r", function () {
      this.resource("subreddit", { path: "/:subreddit" }, function () {
        this.resource("aboutStickyRedirect", { path: "/about/sticky" }), this.resource("commentsThreadRedirect", { path: "/comments/:thread_id" }, function () {
          this.route("slug", { path: "/:slug" });
        });
        this.route("new");
        this.resource("wiki", function () {
          this.route("page", { path: "/:page" });
        });
        this.resource("thread", { path: "/:thread_id" }, function () {
          this.resource("comments", function () {
            this.route("sign");
            this.route("ubi");
            this.route("chain");
          });
        });
      });
    });
    this.resource("btc", function () {
      this.route("address", { path: "/addr/:address" });
    });
    this.route("privacy");
    this.route("about");
  });

  window.onclick = function (e) {
    e = e || window.event;
    var t = e.target || e.srcElement;
    t = Ember['default'].$(t).closest("a").get(0);
    if (t && t.href && !Ember['default'].$(t).hasClass("dontintercept") && !Ember['default'].$(t).hasClass("ember-view")) {
      var parts = t.href.split(window.location.origin, 2);
      if (parts.length <= 1) {
        var parts = t.href.split("reddit.com", 2);
      }
      if (parts.length > 1) {
        e.preventDefault();
        try {
          window.location.hash = parts[1];
        } catch (err) {
          console.error(err.stack || err);
        }
        return false;
      }
    }
  };

});
define('fairshare-site/routes/about-sticky-redirect', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model(args) {
      return args.thread_id;
    },

    redirect: function redirect(model) {
      var subreddit = this.modelFor("subreddit");
      this.transitionTo("/r/" + subreddit.display_name + "/sticky");
    }
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

        return client['default'].auth(code).then(function () {
          return client['default']("/api/v1/me").get();
        }).then((function (res) {
          this.growl.info(["<h1>Logged in as", res.name, "</h1>"].join("\n"));
          return res;
        }).bind(this));
      }
      this.growl.info(["<h1>Welcome to <em>V for reddit</em></h1><div class=\"message\">", "<p>This is still an early and incomplete alpha!</p></div>"].join("\n"), {
        closeIn: 6000
      });
    },

    redirect: function redirect(model) {
      if (model) {
        this.transitionTo("ubi");
      }
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
define('fairshare-site/routes/btc/address', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model(args) {
      return Ember['default'].$.ajax({
        url: "https://chain.so/api/v2/address/btc/" + args.address
      }).then(function (data) {
        console.log("data", data);
        return data.data;
      });
    }
  });

});
define('fairshare-site/routes/comments-thread-redirect', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model(args) {
      return args.thread_id;
    },

    redirect: function redirect(model) {
      var subreddit = this.modelFor("subreddit");
      this.transitionTo("/r/" + subreddit.display_name + "/" + model);
    }
  });

});
define('fairshare-site/routes/comments', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model() {
      var post = this.modelFor("thread");
      return client['default']("/comments/" + post.id + ".json").get({ depth: 1 }, {
        bypassAuth: true
      }).then(function (result) {
        var moreItems = result[1].data.children.filterProperty("kind", "more").getEach("data");
        var remainingIds = [];
        post.comments = result[1].data.children.filterProperty("kind", "t1").getEach("data");
        moreItems.forEach(function (item) {
          remainingIds.addObjects(item.children || []);
        });
        remainingIds = remainingIds.map(function (id) {
          return "t1_" + id;
        });
        function getMoreComments() {
          var ids = remainingIds.splice(0, 100);
          if (!ids.length) {
            return Ember['default'].RSVP.resolve();
          }
          return client['default'].raw("https://oauth.reddit.com/api/info.json").get({ id: ids.join(",") }, {
            bypassAuth: true
          }).then(function (result) {
            return (((result || {}).data || {}).children || []).map(function (j) {
              return j.data;
            });
          }).then(function (moreComments) {
            post.comments = post.comments.concat(moreComments);
            return post;
          }).then(getMoreComments);
        }
        return getMoreComments().then(function () {
          return post;
        });
      }).then(function (post) {
        post.persons = post.comments.getEach("author").uniq().without("PoliticBot").without("[deleted]");
        post.comments = post.persons.map(function (name) {
          return post.comments.findProperty("author", name);
        });
        return post;
      });
    }
  });

});
define('fairshare-site/routes/comments/chain', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    auth: Ember['default'].inject.service(),
    bitcore: Ember['default'].inject.service(),

    user: Ember['default'].computed.alias("auth.user"),

    model: function model(args) {
      var address = this.get("auth.address") || "1QH81rDQRjyUa2zfT9UfA7rnPnwwstVNU5";
      return Ember['default'].$.ajax({
        url: "https://chain.so/api/v2/address/btc/" + address
      }).then(function (data) {
        return data.data;
      }).then(function (data) {
        return Ember['default'].$.ajax({
          url: "https://chain.so/api/v2/get_tx_unspent/BTC/" + address
        }).then(function (result) {
          data.unspent = result.data.txs.map(function (tx) {
            tx.value = parseInt(tx.value.replace(".", ""));
            return tx;
          });
          return data;
        });
      });
    },

    setupController: function setupController(controller, model) {
      controller.setProperties({
        model: this.modelFor("thread"),
        escrow: model
      });
    },

    renderTemplate: function renderTemplate() {
      this.render({
        into: "thread"
      });
    },

    actions: {
      postTransaction: function postTransaction() {
        if (!confirm("Are you sure?")) {
          return;
        }
        var controller = this.controllerFor("comments.chain");
        var transaction = controller.get("transaction");
        if (!controller.get("isDistributing")) {
          return;
        }
        transaction.sign(this.get("auth.privateKey"));
        this.get("bitcore").postTransaction(transaction.toString()).then(function (response) {
          alert("Submitted: " + response);
        })["catch"](function (err) {
          console.error("post error", err);
          alert(err.responseText);
        });
      }
    }
  });

});
define('fairshare-site/routes/comments/ubi', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    auth: Ember['default'].inject.service(),

    beforeModel: function beforeModel(model) {
      var subreddit = this.modelFor("subreddit");
      var post = this.modelFor("thread");
      return client['default']("/r/" + subreddit.display_name + "/wiki/incomeescrows.json").get({}, {
        bypassAuth: true
      }).then(function (result) {
        var el = Ember['default'].$(Ember['default'].get(result, "data.content_html") || "");
        Ember['default'].set(subreddit, "escrows", el.find("blockquote h2").toArray().map(function (item) {
          item = Ember['default'].$(item);
          return {
            name: item.find("a:first").text(),
            unit: item.find("em").text(),
            count: parseFloat(item.find("strong").text()),
            percentage: 10
          };
        }));
      }).then(function () {
        var coins = ["doge", "nyan", "rdd", "ltc", "pot"];
        post.prices = {
          satoshi: "0.00000001"
        };
        return Ember['default'].RSVP.all(coins.map(function (name) {
          return Ember['default'].RSVP.resolve(Ember['default'].$.ajax({
            url: "https://chain.so/api/v2/get_price/" + name
          })).then(function (result) {
            return result.data.prices.findProperty("price_base", "BTC");
          }).then(function (data) {
            post.prices[name] = data.price;
          });
        })).then(function () {
          return Ember['default'].RSVP.resolve(Ember['default'].$.ajax({
            url: "https://chain.so/api/v2/get_price/btc"
          })).then(function (result) {
            return result.data.prices.findProperty("price_base", "USD");
          }).then(function (data) {
            post.prices.btc = data.price;
          });
        }).then(function () {
          var comments = post.comments.sortBy("created_utc");
          Ember['default'].set(post, "beneficiaries", comments.getEach("author").uniq().without("[deleted]"));
        });
      });
    },

    afterModel: function afterModel() {
      var post = this.modelFor("thread");
      var sub = this.modelFor("subreddit");
      return client['default']("/r/" + sub.subreddit + "/wiki/index.json").get({}, {
        bypassAuth: true
      }).then(function (result) {
        console.log("data", result.data);
        Ember['default'].set(sub, "wiki", result.data);
      });
    },
    actions: {
      removeCoin: function removeCoin(coin) {
        this.controllerFor("comments.ubi").get("coins").removeObject(coin);
      },
      doDistribution: function doDistribution() {
        var post = this.modelFor("comments.ubi");
        var controller = this.controllerFor("comments.ubi");
        var commentText = Ember['default'].$("#distcomment").val();
        var bits = controller.get("shareTotal.bits");
        var comments = post.beneficiaries.map(function (author) {
          return post.comments.findProperty("author", author);
        }).without(undefined);
        var auth = this.get("auth");
        var errors = [];
        var quoteList = [];
        function makeNextComment() {
          var parent = comments.popObject();
          if (!parent) {
            return;
          }
          var commentLines = commentText.split("\n").map(function (j) {
            return j.trim();
          }).without("");
          var flair = parent.author_flair_css_class || "";
          var parts = flair.split("-").without("only").without("exclusion");
          var quote = quoteList[Math.floor(Math.random() * quoteList.length)];
          commentLines = commentLines.filter(function (line) {
            if (!flair) {
              return true;
            }
            if (flair.match(/exclusion/)) {
              if (parts.find(function (j) {
                return line.toLowerCase().indexOf(j.toLowerCase()) !== -1;
              })) {
                return false;
              }
              return true;
            }
            if (flair.match(/only/)) {
              if (parts.find(function (j) {
                return line.toLowerCase().indexOf(j.toLowerCase()) !== -1;
              })) {
                return true;
              }
              return false;
            }
            return true;
          });
          if (flair) {
            flair = " " + parent.author_flair_text + " (" + flair + ")";
          }
          commentLines.insertAt(0, "---");
          commentLines.pushObject("---");
          console.log("Distributing to", parent.author + " - " + flair, parent.name, flair, commentLines.length, commentLines);
          commentLines.insertAt(0, "FairShare for [" + parent.author + flair + "](/api/info?id=" + parent.name + ")");
          commentLines.pushObject("[" + quote.title + "](" + quote.permalink + ")");
          var commentBody = commentLines.join("\n\n");
          commentBody = auth.signMessage(commentBody).markdown;
          controller.get("distComments").insertAt(0, {
            request: parent,
            commentBody: commentBody
          });
          //return Ember.RSVP.resolve(makeNextComment());
          return client['default']("/api/comment").post({
            api_type: "json",
            thing_id: parent.name,
            text: commentBody
          })["catch"](function (error) {
            errors.pushObject(parent);
            console.error("error", parent, error);
          }).then(makeNextComment);
        }

        function fetchQuotes() {
          return client['default']("/r/quotes/top.json").get({
            sort: "top",
            t: "week",
            limit: 100
          }, {
            bypassAuth: true
          }).then(function (result) {
            return (((result || {}).data || {}).children || []).getEach("data");
          }).then(function (quotes) {
            quoteList = quotes;
          });
        }

        function closePost() {
          //return Ember.RSVP.resolve(makeNextComment());
          return client['default']("/api/comment").post({
            api_type: "json",
            thing_id: post.name,
            text: auth.signMessage(Ember['default'].$("#distlog").text()).markdown
          }).then(function () {}).then(function () {}).then(makeNextComment)["catch"](function (error) {
            console.error("comment error", error);
          })["finally"](function () {
            console.log(commentText);
            if (!errors.length) {
              return;
            }
            console.error("errors", errors);
          });
        }

        function makeNextPost() {
          //return Ember.RSVP.resolve();
          var parts = post.title.split(" - ");
          var num = parseInt(parts[0].slice(1)) + 1;
          var date = moment(parts[1]).add("days", 1).format("YYYY-MM-DD");
          var newTitle = "#" + num + " - " + date;
          return client['default']("/api/submit").post({
            api_type: "json",
            sr: post.subreddit,
            kind: "self",
            title: newTitle,
            text: post.selftext,
            sendreplies: false
          }).then(function (result) {});
        }
        controller.set("isMakingComments", true);
        if (!confirm("Are you sure you want to distribute?")) {
          return;
        }
        if (confirm("Make new post?")) {
          return fetchQuotes().then(makeNextPost).then(closePost);
        } else {
          return fetchQuotes().then(closePost);
        }
      }
    }
  });

  /*return client('/api/flair').post({
    api_type: 'json',
    css_class: 'closed',
    link: post.name,
    text: bits + ' * ' + comments.length
  });*/

  /*return client('/api/editusertext').post({
    api_type: 'json',
    thing_id: post.name,
    text: '# [This distribution is CLOSED for requests](/r/' + post.subreddit + '/about/sticky)'
  });*/

  /*return client('/api/set_subreddit_sticky').post({
    api_type: 'json',
    id: result.name,
    state: true
  });*/

});
define('fairshare-site/routes/multisig/thread', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model(args) {
      return client['default'].raw("https://reddit.com/api/info.json").get({
        id: "t3_" + args.thread_id
      }, { bypassAuth: true }).then(function (result) {
        return (((result || {}).data || {}).children || []).map(function (j) {
          return j.data;
        });
      }).then(function (posts) {
        return posts[0];
      });
    },

    afterModel: function afterModel(post) {
      return client['default']("/r/" + post.subreddit + "/comments/" + post.id + ".json").get({ depth: 1 }, {
        bypassAuth: true
      }).then(function (result) {
        var moreItems = result[1].data.children.filterProperty("kind", "more").getEach("data");
        var remainingIds = [];
        post.comments = result[1].data.children.filterProperty("kind", "t1").getEach("data");
        moreItems.forEach(function (item) {
          remainingIds.addObjects(item.children || []);
        });
        remainingIds = remainingIds.map(function (id) {
          return "t1_" + id;
        });
        function getMoreComments() {
          var ids = remainingIds.splice(0, 100);
          if (!ids.length) {
            return Ember['default'].RSVP.resolve();
          }
          return client['default'].raw("https://oauth.reddit.com/api/info.json").get({ id: ids.join(",") }).then(function (result) {
            return (((result || {}).data || {}).children || []).map(function (j) {
              return j.data;
            });
          }).then(function (moreComments) {
            post.comments = post.comments.concat(moreComments);
            return post;
          }).then(getMoreComments);
        }
        return getMoreComments().then(function () {
          return post;
        });
      }).then(function (post) {
        post.persons = post.comments.getEach("author").uniq().without("PoliticBot").without("[deleted]");
        post.comments = post.persons.map(function (name) {
          return post.comments.findProperty("author", name);
        });
        return post;
      });
    }
  });

});
define('fairshare-site/routes/subreddit', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model(args) {
      return client['default']("/r/" + args.subreddit + "/about.json").get({}, {
        bypassAuth: true
      }).then(function (result) {
        result.data.subreddit = result.data.display_name;
        return result.data;
      });
    },
    afterModel: function afterModel(model) {
      return client['default']("/r/" + model.subreddit + "/wiki/roll.json").get({}, {
        bypassAuth: true
      }).then(function (result) {
        if (!result.data) {
          return;
        }
        var parsed = Ember['default'].$(result.data.content_html);
        Ember['default'].set(model, "roll", parsed.find("li").toArray().map(function (el) {
          el = Ember['default'].$(el);
          console.log("el", el);
          var user = el.find("a:first").text().split("/").pop();
          var pubKey = el.find("em").text();
          var sig = el.find("a:last").text();
          return {
            user: user,
            publicKey: pubKey,
            signature: sig
          };
        }));
      });
    }
  });

});
define('fairshare-site/routes/subreddit/index', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    listing: "hot",

    model: function model() {
      var sub = this.modelFor("subreddit");
      return client['default']("/r/" + sub.subreddit + "/" + this.get("listing")).get({}, {
        bypassAuth: true
      }).then(function (result) {
        return (((result || {}).data || {}).children || []).getEach("data");
      });
    },
    afterModel: function afterModel(model) {
      Ember['default'].set(model, "subreddit", this.modelFor("subreddit"));
    },
    actions: {
      switchThread: function switchThread() {
        var threadId = this.controllerFor("ubi.thread").get("newThreadId");
        if (!threadId) {
          return;
        }
        this.transitionTo("/ubi/" + threadId);
      }
    }
  });

});
define('fairshare-site/routes/subreddit/new', ['exports', 'fairshare-site/routes/subreddit/index'], function (exports, IndexRoute) {

  'use strict';

  exports['default'] = IndexRoute['default'].extend({
    listing: "new",
    renderTemplate: function renderTemplate() {
      this.render("subreddit/index");
    }
  });

});
define('fairshare-site/routes/thread', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model(args) {
      var subreddit = this.modelFor("subreddit");
      if (args.thread_id === "sticky") {
        return client['default']("/r/" + subreddit.display_name + "/hot").get({}, {
          bypassAuth: true
        }).then(function (result) {
          return (((result || {}).data || {}).children || []).getEach("data").get("firstObject");
        });
      }
      return client['default'].raw("https://reddit.com/api/info.json").get({
        id: "t3_" + args.thread_id
      }, { bypassAuth: true }).then(function (result) {
        return (((result || {}).data || {}).children || []).map(function (j) {
          return j.data;
        });
      }).then(function (posts) {
        return posts[0];
      });
    },
    serialize: function serialize(model) {
      return {
        thread_id: Ember['default'].get(model, "id")
      };
    }
  });

});
define('fairshare-site/routes/thread/index', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    redirect: function redirect() {
      var post = this.modelFor("thread");
      if ((post.title || "").match(/#[0-9]* - /)) {
        return this.transitionTo("comments.ubi");
      }
      this.transitionTo("comments");
    }
  });

});
define('fairshare-site/routes/ubi', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    redirect: function redirect() {
      this.transitionTo("/r/GetFairShare/sticky");
    }
  });

});
define('fairshare-site/routes/wiki/index', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    redirect: function redirect() {
      var subreddit = this.modelFor("subreddit");
      this.transitionTo("/r/" + subreddit.display_name + "/wiki/index");
    }
  });

});
define('fairshare-site/routes/wiki/page', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model(args) {
      var sub = this.modelFor("subreddit");
      return client['default']("/r/" + sub.subreddit + "/wiki/" + args.page.toLowerCase() + ".json").get({}, {
        bypassAuth: true
      }).then(function (result) {
        Ember['default'].set(result.data, "subreddit", sub);
        Ember['default'].set(result.data, "title", args.page);
        return result.data;
      });
    }
  });

});
define('fairshare-site/services/auth', ['exports', 'ember', 'fairshare-site/client'], function (exports, Ember, client) {

  'use strict';

  exports['default'] = Ember['default'].Service.extend({
    bitcore: Ember['default'].inject.service(),
    loginUrl: (function () {
      return client['default'].getImplicitAuthUrl();
    }).property("user"),
    loginExpiry: (function () {
      return this.get("loginExpires");
    }).property("loginExpires", "timeupdater.currentMoment"),

    passPhrase: "",
    passPhraseRepeat: (function (key, value) {
      if (arguments.length > 1) {
        return value;
      }
      return "";
    }).property("passPhrase"),

    _checkPassPhrase: function _checkPassPhrase() {
      var phrase = this.get("passPhrase");
      if (!phrase) {
        return;
      }
      var hash = this.get("bitcore").sha256(phrase);
      var privateKey = this.get("bitcore").privateKey(hash);
      var publicKey = this.get("bitcore").publicKey(privateKey);
      this.get("bitcore").getBalance(publicKey.toAddress()).then((function (data) {
        if (data.total_txs) {
          if (phrase === this.get("passPhrase")) {
            this.set("passPhraseRepeat", phrase);
          }
        }
      }).bind(this));
    },

    checkPassPhrase: (function () {
      Ember['default'].run.debounce(this, this._checkPassPhrase, 500);
    }).observes("passPhrase"),

    username: (function () {
      var username = this.get("user.name");
      if (!username) {
        return "anonymous";
      }
      return username;
    }).property("user.name"),

    matchingPassPhrase: (function () {
      if (this.get("passPhrase") === this.get("passPhraseRepeat")) {
        return this.get("passPhrase");
      }
    }).property("passPhrase", "passPhraseRepeat"),

    hashedPassPhrase: (function () {
      var phrase = this.get("matchingPassPhrase");
      if (!phrase) {
        return;
      }
      return this.get("bitcore").sha256(phrase);
    }).property("matchingPassPhrase"),

    privateKey: (function () {
      var hashed = this.get("hashedPassPhrase");
      if (!hashed) {
        return;
      }
      return this.get("bitcore").privateKey(hashed);
    }).property("hashedPassPhrase"),

    publicKey: (function () {
      var privateKey = this.get("privateKey");
      if (!privateKey) {
        return;
      }
      return this.get("bitcore").publicKey(privateKey);
    }).property("privateKey"),

    address: (function () {
      var publicKey = this.get("publicKey");
      if (!publicKey) {
        return;
      }
      return publicKey.toAddress();
    }).property("publicKey"),

    balance: (function () {
      return parseInt((this.get("addressData.balance") || "").replace(".", ""));
    }).property("addressData.balance"),

    unspent: [],

    updateBalance: (function () {
      var address = this.get("address");
      if (address) {
        Ember['default'].$.ajax({
          url: "https://chain.so/api/v2/address/btc/" + address
        }).then((function (data) {
          console.log("data", data);
          this.set("addressData", data.data);
        }).bind(this));
        this.get("bitcore").getUnspentOutputs(address).then((function (unspent) {
          this.set("unspent", unspent);
        }).bind(this));
      }
    }).observes("address"),

    addressString: (function () {
      var address = this.get("address");
      if (!address) {
        return;
      }
      return address.toString();
    }).property("address"),

    dateMessage: function dateMessage(message) {
      return [message, "---", "^(" + this.get("username") + " at " + moment().utc().format("YYYY-MM-DD HH:MM:SS utc") + ")"].join("\n\n");
    },

    signMessage: function signMessage(message) {
      var datedMessage = this.dateMessage(message);
      var privateKey = this.get("privateKey");
      var address = this.get("address");
      if (!address) {
        return;
      }
      var signature = this.get("bitcore").signMessage(message, privateKey);
      var markdown = ["**[^^^^(" + address + ")](https://fair-share.github.io/#/btc/addr/" + address + ")**", datedMessage, "*^^^^(" + signature + ")*"].join("\n\n");
      message = this.get("bitcore").normalizeMarkdown(datedMessage);
      return {
        dated: datedMessage,
        signature: signature,
        markdown: markdown
      };
    },

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
    }).observes("timeupdater.currentMoment"),

    sendBtc: function sendBtc(dest, amount) {
      var bitcore = this.get("bitcore");
      var address = this.get("address");
      var privateKey = this.get("privateKey");
      if (!address) {
        return;
      }
      var transaction = bitcore.transaction().to(dest, amount).change(address);
      return bitcore.getUnspentOutputs(address).then((function (uxto) {
        var totalInputs = 0;
        var tx;
        while (totalInputs < amount) {
          tx = uxto.popObject();
          if (!tx) {
            alert("Insufficient inputs");
            return;
          }
          totalInputs += tx.satoshis;
          transaction.from(tx);
        }
        transaction.sign(privateKey);
        return bitcore.postTransaction(transaction).then(function (result) {
          alert("Sent " + amount + " to " + address);
        })["catch"](function (error) {
          console.error("error", error);
          alert(err.responseText);
          throw error;
        }).then(this.updateBalance.bind(this));
      }).bind(this));
    }
  });

});
define('fairshare-site/services/bitcore', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var bitcore = require("bitcore");
  var Message = require("bitcore-message");

  exports['default'] = Ember['default'].Service.extend({
    Message: bitcore.Message,
    Address: bitcore.Address,
    PublicKey: bitcore.PublicKey,
    PrivateKey: bitcore.PrivateKey,
    Transaction: bitcore.Transaction,

    normalizeMarkdown: function normalizeMarkdown(plaintext) {
      return (plaintext || "").replace(/\W+/g, " ").trim();
    },

    sha256: function sha256(input) {
      return bitcore.crypto.Hash.sha256(new bitcore.deps.Buffer(input)).toString("hex");
    },

    message: function message(input) {
      return new Message(input);
    },

    signMessage: function signMessage(message, privateKey) {
      return this.message(message).sign(privateKey);
    },

    verifySignature: function verifySignature(message, address, signature) {
      return this.message(message).verify(address, signature);
    },

    publicKey: function publicKey(input) {
      return new bitcore.PublicKey(input);
    },

    privateKey: function privateKey(input) {
      return new bitcore.PrivateKey(input);
    },

    address: function address(input) {
      return new bitcore.Address(input);
    },

    transaction: function transaction(input) {
      return new bitcore.Transaction(input);
    },

    unspentOutput: function unspentOutput(input) {
      return new bitcore.Transaction.UnspentOutput(input);
    },

    postTransaction: function postTransaction(transaction) {
      return Ember['default'].RSVP.resolve(Ember['default'].$.ajax({
        method: "post",
        url: "https://blockchain.info/pushtx?cors=true",
        data: {
          tx: transaction + ""
        }
      }).then(function (response) {
        console.log("blockchain response", response);
      }));
    },

    getUnspentOutputs: function getUnspentOutputs(address) {
      var bc = this;
      return Ember['default'].RSVP.resolve(Ember['default'].$.ajax({
        url: "https://chain.so/api/v2/get_tx_unspent/BTC/" + address
      })).then(function (result) {
        return result.data.txs.map(function (tx) {
          return bc.unspentOutput({
            txid: tx.txid,
            satoshis: parseInt(tx.value.replace(".", "")),
            vout: tx.output_no,
            script: tx.script_hex
          });
        }).sortBy("satoshis").reverse();
      })["catch"](function (err) {
        console.error("getUnspentOutputs", address, err);
        return [];
      });
    },

    getBalance: function getBalance(address) {
      return Ember['default'].RSVP.resolve(Ember['default'].$.ajax({
        url: "https://chain.so/api/v2/address/btc/" + address
      })).then(function (data) {
        return data.data;
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
define('fairshare-site/templates/about', ['exports'], function (exports) {

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
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","row");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-8");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h1");
        var el4 = dom.createTextNode("What is FairShare?");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("hr");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createTextNode("Proof of Entitlement");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createTextNode("A Proof of Entitlement determines who is eligible to receive a FairShare");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createTextNode("Administration");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createTextNode("Some actor(s) need to manage and administer a FairShare system.  This could be software, or social.");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createTextNode("Income Escrow");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createTextNode("A FairShare system must have a pool (or other source) of currency to distribute.");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createTextNode("Distribution Model");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createTextNode("A FairShare system should define how the Income Escrow gets distributed to entitled participants");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("hr");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h1");
        var el4 = dom.createTextNode("FairShare is just an idea.  Run with it!");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("blockquote");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("p");
        var el5 = dom.createTextNode("\n        That ideas should freely spread from one to another over the globe,\n        for the moral and mutual instruction of man, and improvement of his condition,\n        seems to have been peculiarly and benevolently designed by nature, when she made them,\n        like fire, expansible over all space, without lessening their density in any point,\n        and like the air in which we breathe, move, and have our physical being,\n        incapable of confinement or exclusive appropriation.\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("footer");
        var el5 = dom.createTextNode("Thomas Jefferson");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-4");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h3");
        var el4 = dom.createTextNode("Examples");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("hr");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h4");
        var el4 = dom.createElement("a");
        dom.setAttribute(el4,"href","http://reddit.com/r/GetFairShare");
        dom.setAttribute(el4,"target","reddit");
        var el5 = dom.createTextNode("/r/GetFairShare");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    POE: Reddit Account");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ADM: Interim Benevolent Dictator");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    IE: Crypto Tip bots + Voluntary donations");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    DM: 1/10 of tip jar daily to commenters\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h4");
        var el4 = dom.createTextNode("Voluntary-Stateless UBI");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    POE: To Be Determined");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ADM: Crypto-Multisig Democracy");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    IE: P2SH Multisig + Voluntary donations");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    DM: 1/10 of P2SH daily to requesters\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h4");
        var el4 = dom.createTextNode("Demurred Crypto UBI");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    POE: To Be Determined");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ADM: Crypto-Multisig Democracy");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    IE: Dedicated Cryptocurrency with Demmurage");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    DM: 100% of demurred funds per period\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h4");
        var el4 = dom.createTextNode("Corporate/Cooperative UBI");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    POE: Stockholders");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ADM: Corporate Board of Directors");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    IE: Corporate/cooperative profits");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    DM: Percentage of profits disbursed as dividends\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h4");
        var el4 = dom.createTextNode("Authoritarian Communism");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    POE: Comrade's Papers");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ADM: Government");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    IE: 100% tax rate");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    DM: Some % of all collected taxes\n  ");
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
          var el1 = dom.createTextNode("\n          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          dom.setAttribute(el1,"title","logout");
          var el2 = dom.createTextNode("Logout: ");
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
          var element2 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(element2,1,1);
          element(env, element2, context, "action", ["logout"], {});
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
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          dom.setAttribute(el1,"title","Login");
          dom.setAttribute(el1,"class","dontintercept");
          var el2 = dom.createTextNode("Login at reddit");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n        ");
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
          var element1 = dom.childAt(fragment, [1]);
          element(env, element1, context, "bind-attr", [], {"href": get(env, context, "loginUrl")});
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.0",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode(" - Balance: ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode(" satoshi\n");
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
            var morph1 = dom.createMorphAt(fragment,3,3,contextualElement);
            content(env, morph0, context, "auth.address");
            content(env, morph1, context, "auth.balance");
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
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "link-to", ["btc.address", get(env, context, "auth.addressString")], {"tagName": "button", "class": "btn form-control", "classNameBindings": "auth.addressData.total_txs:btn-success:btn-default"}, child0, null);
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.0",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("              Balance: ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode(" satoshi\n");
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
              content(env, morph0, context, "auth.balance");
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
            var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, null);
            dom.insertBoundary(fragment, 0);
            block(env, morph0, context, "link-to", ["btc.address", get(env, context, "auth.addressString")], {"tagName": "button", "class": "btn form-control", "classNameBindings": "auth.addressData.total_txs:btn-success:btn-default"}, child0, null);
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
            var el1 = dom.createTextNode("            ");
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
            inline(env, morph0, context, "input", [], {"type": "password", "value": get(env, context, "auth.passPhraseRepeat"), "class": "form-control", "placeholder": "Repeat FairShare passphrase"});
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
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","row");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-sm-6");
          var el3 = dom.createTextNode("\n          ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n        ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-sm-6");
          var el3 = dom.createTextNode("\n");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("        ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline, block = hooks.block;
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
          var element0 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(dom.childAt(element0, [1]),1,1);
          var morph1 = dom.createMorphAt(dom.childAt(element0, [2]),1,1);
          inline(env, morph0, context, "input", [], {"type": "password", "value": get(env, context, "auth.passPhrase"), "class": "form-control", "placeholder": "FairShare passphrase"});
          block(env, morph1, context, "if", [get(env, context, "auth.address")], {}, child0, child1);
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
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","navbar navbar-default navbar-fixed-top");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","container");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","navbar-header");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"id","navbar");
        dom.setAttribute(el3,"class","navbar-collapse collapse");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("ul");
        dom.setAttribute(el4,"class","nav navbar-nav");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("li");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("li");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("li");
        var el6 = dom.createElement("a");
        dom.setAttribute(el6,"target","reddit");
        dom.setAttribute(el6,"href","https://reddit.com/r/FairShare");
        var el7 = dom.createTextNode("reddit");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("li");
        var el6 = dom.createElement("a");
        dom.setAttribute(el6,"target","changetip");
        dom.setAttribute(el6,"href","https://PoliticBot.tip.me");
        var el7 = dom.createTextNode("changetip");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("li");
        var el6 = dom.createElement("a");
        dom.setAttribute(el6,"target","github");
        dom.setAttribute(el6,"href","https://github.com/Fair-Share");
        var el7 = dom.createTextNode("github");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("ul");
        dom.setAttribute(el4,"class","nav navbar-nav navbar-right");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("li");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("li");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"id","maincontainer");
        dom.setAttribute(el1,"class","container");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("footer");
        dom.setAttribute(el1,"class","footer");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("hr");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","container");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("hr");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("footer");
        dom.setAttribute(el1,"id","footer");
        var el2 = dom.createTextNode("\nAll code and concepts are licensed under ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","http://www.wtfpl.net");
        dom.setAttribute(el2,"target","license");
        var el3 = dom.createTextNode("WTFPLv2");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(".  Build something!\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, inline = hooks.inline, get = hooks.get, block = hooks.block, content = hooks.content;
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
        var element3 = dom.childAt(fragment, [0, 1]);
        var element4 = dom.childAt(element3, [3]);
        var element5 = dom.childAt(element4, [1]);
        var element6 = dom.childAt(element4, [3]);
        var morph0 = dom.createMorphAt(dom.childAt(element3, [1]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(element5, [1]),0,0);
        var morph2 = dom.createMorphAt(dom.childAt(element5, [3]),0,0);
        var morph3 = dom.createMorphAt(dom.childAt(element6, [1]),0,0);
        var morph4 = dom.createMorphAt(dom.childAt(element6, [3]),0,0);
        var morph5 = dom.createMorphAt(dom.childAt(fragment, [2]),0,0);
        var morph6 = dom.createMorphAt(dom.childAt(fragment, [4, 3]),1,1);
        inline(env, morph0, context, "link-to", ["Fair-Share", "index"], {"class": "navbar-brand"});
        inline(env, morph1, context, "link-to", ["ubi", "ubi"], {});
        inline(env, morph2, context, "link-to", ["about", "about"], {});
        inline(env, morph3, context, "link-to", ["Privacy Policy", "privacy"], {});
        block(env, morph4, context, "if", [get(env, context, "user")], {}, child0, child1);
        content(env, morph5, context, "outlet");
        block(env, morph6, context, "if", [get(env, context, "auth.addressData.total_txs")], {}, child2, child3);
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/btc/address', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.0",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("          ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("h2");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode(" Inputs ");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode(" BTC");
              dom.appendChild(el1, el2);
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
              var element1 = dom.childAt(fragment, [1]);
              var morph0 = dom.createMorphAt(element1,0,0);
              var morph1 = dom.createMorphAt(element1,2,2);
              content(env, morph0, context, "tx.incoming.inputs.length");
              content(env, morph1, context, "tx.incoming.value");
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
              var el1 = dom.createTextNode("          ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("h2");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode(" Outputs ");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode(" BTC");
              dom.appendChild(el1, el2);
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
              var element0 = dom.childAt(fragment, [1]);
              var morph0 = dom.createMorphAt(element0,0,0);
              var morph1 = dom.createMorphAt(element0,2,2);
              content(env, morph0, context, "tx.outgoing.outputs.length");
              content(env, morph1, context, "tx.outgoing.value");
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
            var el1 = dom.createTextNode("      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","well");
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("h5");
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("h3");
            var el3 = dom.createTextNode("Block #");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode(" ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode(" ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode(" Confirmations");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("      ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, content = hooks.content, get = hooks.get, inline = hooks.inline, block = hooks.block;
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
            var element2 = dom.childAt(fragment, [1]);
            var element3 = dom.childAt(element2, [3]);
            var morph0 = dom.createMorphAt(dom.childAt(element2, [1]),0,0);
            var morph1 = dom.createMorphAt(element3,1,1);
            var morph2 = dom.createMorphAt(element3,3,3);
            var morph3 = dom.createMorphAt(element3,5,5);
            var morph4 = dom.createMorphAt(element2,5,5);
            var morph5 = dom.createMorphAt(element2,6,6);
            content(env, morph0, context, "tx.txid");
            content(env, morph1, context, "tx.block_no");
            inline(env, morph2, context, "ago", [get(env, context, "tx.time"), "X"], {});
            content(env, morph3, context, "tx.confirmations");
            block(env, morph4, context, "if", [get(env, context, "tx.incoming.value")], {}, child0, null);
            block(env, morph5, context, "if", [get(env, context, "tx.outgoing.value")], {}, child1, null);
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
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("hr");
          dom.appendChild(el0, el1);
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
          var morph0 = dom.createMorphAt(fragment,3,3,contextualElement);
          dom.insertBoundary(fragment, null);
          block(env, morph0, context, "each", [get(env, context, "model.txs")], {"keyword": "tx"}, child0, null);
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
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","row address-page");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-4");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createTextNode("Send BTC");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-8");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h3");
        var el4 = dom.createTextNode("Total Transactions: ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h3");
        var el4 = dom.createTextNode("Received: ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h3");
        var el4 = dom.createTextNode("Pending: ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h1");
        var el4 = dom.createTextNode("Balance: ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
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
        var element4 = dom.childAt(fragment, [0]);
        var element5 = dom.childAt(element4, [1]);
        var element6 = dom.childAt(element4, [3]);
        var element7 = dom.childAt(element6, [5]);
        var element8 = dom.childAt(element6, [7]);
        var element9 = dom.childAt(element6, [9]);
        var morph0 = dom.createMorphAt(element5,3,3);
        var morph1 = dom.createMorphAt(element5,5,5);
        var morph2 = dom.createMorphAt(dom.childAt(element6, [1]),0,0);
        var morph3 = dom.createMorphAt(dom.childAt(element6, [3]),1,1);
        var morph4 = dom.createMorphAt(element7,1,1);
        var morph5 = dom.createMorphAt(element7,3,3);
        var morph6 = dom.createMorphAt(element8,1,1);
        var morph7 = dom.createMorphAt(element8,3,3);
        var morph8 = dom.createMorphAt(element9,1,1);
        var morph9 = dom.createMorphAt(element9,3,3);
        var morph10 = dom.createMorphAt(element6,11,11);
        inline(env, morph0, context, "send-btc", [], {"dest": get(env, context, "model.address")});
        inline(env, morph1, context, "qr-code", [], {"value": get(env, context, "model.address")});
        content(env, morph2, context, "model.address");
        content(env, morph3, context, "model.total_txs");
        content(env, morph4, context, "model.received_value");
        content(env, morph5, context, "model.network");
        content(env, morph6, context, "model.pending_value");
        content(env, morph7, context, "model.network");
        content(env, morph8, context, "model.balance");
        content(env, morph9, context, "model.network");
        block(env, morph10, context, "if", [get(env, context, "model.txs.length")], {}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/comments', ['exports'], function (exports) {

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
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          dom.setAttribute(el1,"class","media");
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
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
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          inline(env, morph0, context, "display-comment", [], {"comment": get(env, context, "comment")});
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
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","row");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-4");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" Comments");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h4");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" Top-Level");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("hr");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("ul");
        dom.setAttribute(el3,"class","media-list comments");
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-8");
        var el3 = dom.createComment("");
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
        var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
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
        var element1 = dom.childAt(element0, [1]);
        var morph0 = dom.createMorphAt(dom.childAt(element1, [1]),0,0);
        var morph1 = dom.createMorphAt(dom.childAt(element1, [3]),0,0);
        var morph2 = dom.createMorphAt(dom.childAt(element1, [7]),1,1);
        var morph3 = dom.createMorphAt(dom.childAt(element0, [3]),0,0);
        content(env, morph0, context, "model.num_comments");
        content(env, morph1, context, "model.comments.length");
        block(env, morph2, context, "each", [get(env, context, "model.comments")], {"keyword": "comment"}, child0, null);
        content(env, morph3, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/comments/chain', ['exports'], function (exports) {

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
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("hr");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h4");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" satoshi");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("pre");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
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
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [3]),0,0);
          var morph1 = dom.createMorphAt(dom.childAt(fragment, [5]),0,0);
          content(env, morph0, context, "input.output.satoshis");
          content(env, morph1, context, "input.output.script");
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
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("hr");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h4");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" satoshi");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("pre");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
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
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [3]),0,0);
          var morph1 = dom.createMorphAt(dom.childAt(fragment, [5]),0,0);
          content(env, morph0, context, "output.satoshis");
          content(env, morph1, context, "output.script");
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
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          dom.setAttribute(el1,"class","media");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline, content = hooks.content;
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
          var morph1 = dom.createMorphAt(element1,3,3);
          inline(env, morph0, context, "display-comment", [], {"comment": get(env, context, "item.comment"), "hideMessage": true});
          content(env, morph1, context, "item.address");
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
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("button");
          dom.setAttribute(el1,"class","btn btn-danger form-control");
          var el2 = dom.createTextNode("\n        Post to Blockchain\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("hr");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, element = hooks.element;
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
          var element0 = dom.childAt(fragment, [1]);
          element(env, element0, context, "action", ["postTransaction"], {});
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
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","row");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-4");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createTextNode("Blockchain UBI");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("hr");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","input-group");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("span");
        dom.setAttribute(el4,"class","input-group-addon");
        var el5 = dom.createTextNode("Balance: ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode(" satoshi");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("span");
        dom.setAttribute(el4,"class","input-group-addon");
        var el5 = dom.createTextNode("Percent");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("hr");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h3");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" Inputs");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h3");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" Outputs");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-4");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" Addresses");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("hr");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("ul");
        dom.setAttribute(el3,"class","media-list comments");
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-4");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createTextNode("Transaction Details");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("hr");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h3");
        var el4 = dom.createTextNode("FairShare: ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" satoshi");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("table");
        dom.setAttribute(el3,"class","table");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("tbody");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("tr");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createTextNode("Disbursement");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("td");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("tr");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createTextNode("Miner Fee");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("td");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("tr");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createTextNode("Change");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("td");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("tr");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createTextNode("Total");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("hr");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h1");
        var el4 = dom.createTextNode("JSON");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("pre");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h1");
        var el4 = dom.createTextNode("Hexadecimal");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("pre");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n  ");
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
        var hooks = env.hooks, content = hooks.content, get = hooks.get, inline = hooks.inline, block = hooks.block;
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
        var element2 = dom.childAt(fragment, [0]);
        var element3 = dom.childAt(element2, [1]);
        var element4 = dom.childAt(element3, [5]);
        var element5 = dom.childAt(element2, [3]);
        var element6 = dom.childAt(element2, [5]);
        var element7 = dom.childAt(element6, [7, 1]);
        var morph0 = dom.createMorphAt(dom.childAt(element4, [1]),1,1);
        var morph1 = dom.createMorphAt(element4,3,3);
        var morph2 = dom.createMorphAt(dom.childAt(element3, [9]),0,0);
        var morph3 = dom.createMorphAt(element3,11,11);
        var morph4 = dom.createMorphAt(dom.childAt(element3, [13]),0,0);
        var morph5 = dom.createMorphAt(element3,15,15);
        var morph6 = dom.createMorphAt(dom.childAt(element5, [1]),0,0);
        var morph7 = dom.createMorphAt(dom.childAt(element5, [5]),1,1);
        var morph8 = dom.createMorphAt(dom.childAt(element6, [5]),1,1);
        var morph9 = dom.createMorphAt(dom.childAt(element7, [1, 3]),0,0);
        var morph10 = dom.createMorphAt(dom.childAt(element7, [2, 3]),0,0);
        var morph11 = dom.createMorphAt(dom.childAt(element7, [3, 3]),0,0);
        var morph12 = dom.createMorphAt(dom.childAt(element7, [4, 3]),0,0);
        var morph13 = dom.createMorphAt(element6,11,11);
        var morph14 = dom.createMorphAt(dom.childAt(element6, [15]),0,0);
        var morph15 = dom.createMorphAt(dom.childAt(element6, [19]),0,0);
        content(env, morph0, context, "balance");
        inline(env, morph1, context, "input", [], {"value": get(env, context, "percentage"), "class": "form-control"});
        content(env, morph2, context, "transactionObj.inputs.length");
        block(env, morph3, context, "each", [get(env, context, "transactionObj.inputs")], {"keyword": "input"}, child0, null);
        content(env, morph4, context, "transactionObj.outputs.length");
        block(env, morph5, context, "each", [get(env, context, "transactionObj.outputs")], {"keyword": "output"}, child1, null);
        content(env, morph6, context, "uniqueSignatures.length");
        block(env, morph7, context, "each", [get(env, context, "uniqueSignatures")], {"keyword": "item"}, child2, null);
        content(env, morph8, context, "fairShare");
        content(env, morph9, context, "totalDistribution");
        content(env, morph10, context, "minerFee");
        content(env, morph11, context, "change");
        content(env, morph12, context, "totalInputs");
        block(env, morph13, context, "if", [get(env, context, "isDistributing")], {}, child3, null);
        content(env, morph14, context, "transactionJsonString");
        content(env, morph15, context, "transactionString");
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/comments/index', ['exports'], function (exports) {

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
        var el2 = dom.createTextNode("Leave Comment");
        dom.appendChild(el1, el2);
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
        var morph0 = dom.createMorphAt(fragment,2,2,contextualElement);
        inline(env, morph0, context, "sign-comment", [], {"thingId": get(env, context, "model.name"), "hideMarkdown": false, "comments": get(env, context, "model.comments")});
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/comments/loading', ['exports'], function (exports) {

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
        dom.setAttribute(el1,"class","loading");
        var el2 = dom.createTextNode("Loading More Data...");
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
define('fairshare-site/templates/comments/ubi', ['exports'], function (exports) {

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
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h3");
          var el2 = dom.createTextNode("FairShare Requested");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
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
          var morph0 = dom.createMorphAt(fragment,3,3,contextualElement);
          inline(env, morph0, context, "display-comment", [], {"comment": get(env, context, "requestComment")});
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.0",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("+/u/");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode(" ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode(" ");
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
              var morph1 = dom.createMorphAt(fragment,3,3,contextualElement);
              var morph2 = dom.createMorphAt(fragment,5,5,contextualElement);
              content(env, morph0, context, "share.coin.name");
              content(env, morph1, context, "share.amount");
              content(env, morph2, context, "share.coin.unit");
              return fragment;
            }
          };
        }());
        var child1 = (function() {
          var child0 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.0",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("          ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("h5");
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n          ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("pre");
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n          ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("hr");
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
                var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
                var morph1 = dom.createMorphAt(dom.childAt(fragment, [3]),0,0);
                content(env, morph0, context, "item.request.author");
                content(env, morph1, context, "item.commentBody");
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
              var el1 = dom.createTextNode("        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("hr");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("h4");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode(" Shares Sent");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("hr");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
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
              var morph0 = dom.createMorphAt(dom.childAt(fragment, [3]),0,0);
              var morph1 = dom.createMorphAt(fragment,7,7,contextualElement);
              dom.insertBoundary(fragment, null);
              content(env, morph0, context, "distComments.length");
              block(env, morph1, context, "each", [get(env, context, "distComments")], {"keyword": "item"}, child0, null);
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
              var el1 = dom.createTextNode("        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("button");
              dom.setAttribute(el1,"class","btn btn-danger form-control");
              var el2 = dom.createTextNode("Do Distribution");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, element = hooks.element;
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
              var element7 = dom.childAt(fragment, [1]);
              element(env, element7, context, "action", ["doDistribution"], {});
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
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("h3");
            var el2 = dom.createTextNode("Tip Commands (Limit of ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode(")");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("textarea");
            dom.setAttribute(el1,"class","form-control");
            dom.setAttribute(el1,"id","distcomment");
            dom.setAttribute(el1,"rows","3");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
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
            var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
            var morph1 = dom.createMorphAt(dom.childAt(fragment, [3]),0,0);
            var morph2 = dom.createMorphAt(fragment,5,5,contextualElement);
            dom.insertBoundary(fragment, null);
            content(env, morph0, context, "maxCoins");
            block(env, morph1, context, "each", [get(env, context, "shares")], {"keyword": "share"}, child0, null);
            block(env, morph2, context, "if", [get(env, context, "isMakingComments")], {}, child1, child2);
            return fragment;
          }
        };
      }());
      var child1 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.0",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("          ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("h3");
              var el2 = dom.createTextNode("Request FairShare");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n          ");
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
              var morph0 = dom.createMorphAt(fragment,3,3,contextualElement);
              inline(env, morph0, context, "sign-comment", [], {"thingId": get(env, context, "model.name"), "hideMarkdown": false, "statusMessage": "Requesting FairShare...", "buttonText": "Request FairShare", "comments": get(env, context, "model.comments")});
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
              var el1 = dom.createTextNode("          ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("a");
              dom.setAttribute(el1,"class","btn btn-success form-control dontintercept");
              var el2 = dom.createTextNode("Login at reddit to request FairShare");
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
              var element6 = dom.childAt(fragment, [1]);
              element(env, element6, context, "bind-attr", [], {"href": get(env, context, "auth.loginUrl")});
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
            var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, null);
            dom.insertBoundary(fragment, 0);
            block(env, morph0, context, "if", [get(env, context, "user.name")], {}, child0, child1);
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
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "if", [get(env, context, "isDistributing")], {}, child0, child1);
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
          var el1 = dom.createElement("hr");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
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
          var morph0 = dom.createUnsafeMorphAt(fragment,1,1,contextualElement);
          dom.insertBoundary(fragment, null);
          content(env, morph0, context, "subreddit.wiki.content_html");
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.0",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","row");
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-md-6");
            var el3 = dom.createTextNode("\n          ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode(" ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("br");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n          ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode(" BTC\n        ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-md-6");
            var el3 = dom.createTextNode("\n          ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("div");
            dom.setAttribute(el3,"class","input-group");
            var el4 = dom.createTextNode("\n            ");
            dom.appendChild(el3, el4);
            var el4 = dom.createComment("");
            dom.appendChild(el3, el4);
            var el4 = dom.createTextNode("\n            ");
            dom.appendChild(el3, el4);
            var el4 = dom.createElement("span");
            dom.setAttribute(el4,"class","input-group-addon");
            var el5 = dom.createTextNode("%");
            dom.appendChild(el4, el5);
            dom.appendChild(el3, el4);
            var el4 = dom.createTextNode("\n            ");
            dom.appendChild(el3, el4);
            var el4 = dom.createElement("span");
            dom.setAttribute(el4,"class","input-group-btn");
            var el5 = dom.createTextNode("\n              ");
            dom.appendChild(el4, el5);
            var el5 = dom.createElement("button");
            dom.setAttribute(el5,"class","btn btn-danger");
            var el6 = dom.createTextNode("\n                X\n              ");
            dom.appendChild(el5, el6);
            dom.appendChild(el4, el5);
            var el5 = dom.createTextNode("\n            ");
            dom.appendChild(el4, el5);
            dom.appendChild(el3, el4);
            var el4 = dom.createTextNode("\n          ");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n        ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n      ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, content = hooks.content, get = hooks.get, inline = hooks.inline, element = hooks.element;
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
            var element2 = dom.childAt(element1, [1]);
            var element3 = dom.childAt(element1, [2, 1]);
            var element4 = dom.childAt(element3, [5, 1]);
            var morph0 = dom.createMorphAt(element2,1,1);
            var morph1 = dom.createMorphAt(element2,3,3);
            var morph2 = dom.createMorphAt(element2,6,6);
            var morph3 = dom.createMorphAt(element3,1,1);
            content(env, morph0, context, "total.coin.count");
            content(env, morph1, context, "total.coin.unit");
            content(env, morph2, context, "total.value");
            inline(env, morph3, context, "input", [], {"value": get(env, context, "total.coin.percentage"), "class": "form-control"});
            element(env, element4, context, "action", ["removeCoin", get(env, context, "total.coin")], {});
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
            var el1 = dom.createTextNode("## ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode(": ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode(" ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n### ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("% Disbursement: ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode(" ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n# FairShare: ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode(" ");
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
            var morph1 = dom.createMorphAt(fragment,3,3,contextualElement);
            var morph2 = dom.createMorphAt(fragment,5,5,contextualElement);
            var morph3 = dom.createMorphAt(fragment,7,7,contextualElement);
            var morph4 = dom.createMorphAt(fragment,9,9,contextualElement);
            var morph5 = dom.createMorphAt(fragment,11,11,contextualElement);
            var morph6 = dom.createMorphAt(fragment,13,13,contextualElement);
            var morph7 = dom.createMorphAt(fragment,15,15,contextualElement);
            content(env, morph0, context, "share.coin.name");
            content(env, morph1, context, "share.coin.count");
            content(env, morph2, context, "share.coin.unit");
            content(env, morph3, context, "share.coin.percentage");
            content(env, morph4, context, "share.total.amount");
            content(env, morph5, context, "share.coin.unit");
            content(env, morph6, context, "share.amount");
            content(env, morph7, context, "share.coin.unit");
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
            var el1 = dom.createTextNode("/u/");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n\n");
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
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("form");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("pre");
          dom.setAttribute(el1,"id","distlog");
          var el2 = dom.createTextNode("# ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n---\n\n# Income Escrow\n\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n# FairShare Value Estimate\n## ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" bits (BTC)\n\n---\n\n# ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" UBI Beneficiaries\n\n");
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
          var element5 = dom.childAt(fragment, [3]);
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          var morph1 = dom.createMorphAt(element5,1,1);
          var morph2 = dom.createMorphAt(element5,3,3);
          var morph3 = dom.createMorphAt(element5,5,5);
          var morph4 = dom.createMorphAt(element5,7,7);
          var morph5 = dom.createMorphAt(element5,9,9);
          block(env, morph0, context, "each", [get(env, context, "totals")], {"keyword": "total"}, child0, null);
          content(env, morph1, context, "title");
          block(env, morph2, context, "each", [get(env, context, "shares")], {"keyword": "share"}, child1, null);
          content(env, morph3, context, "shareTotal.bits");
          content(env, morph4, context, "beneficiaryCount");
          block(env, morph5, context, "each", [get(env, context, "beneficiaries")], {"keyword": "name"}, child2, null);
          return fragment;
        }
      };
    }());
    var child4 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.0",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("          ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("tr");
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("th");
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("td");
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("td");
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode(" BTC");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
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
            var element0 = dom.childAt(fragment, [1]);
            var morph0 = dom.createMorphAt(dom.childAt(element0, [1]),0,0);
            var morph1 = dom.createMorphAt(dom.childAt(element0, [3]),0,0);
            var morph2 = dom.createMorphAt(dom.childAt(element0, [5]),0,0);
            content(env, morph0, context, "total.coin.unit");
            content(env, morph1, context, "total.coin.count");
            content(env, morph2, context, "total.value");
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
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("table");
          dom.setAttribute(el1,"class","table");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("thead");
          var el3 = dom.createTextNode("\n          ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("tr");
          var el4 = dom.createTextNode("\n            ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("th");
          var el5 = dom.createTextNode("Currency");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n            ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("th");
          var el5 = dom.createTextNode("Amount");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n            ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("th");
          var el5 = dom.createTextNode("BTC Value");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n        ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("tbody");
          var el3 = dom.createTextNode("\n");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("        ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
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
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1, 2]),1,1);
          block(env, morph0, context, "each", [get(env, context, "totals")], {"keyword": "total"}, child0, null);
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
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","row");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-6");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" Beneficiaries");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h4");
        var el4 = dom.createTextNode("FairShare Estimate ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" bits / $");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("hr");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-6");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createTextNode("Income Escrow");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h4");
        var el4 = dom.createTextNode("Estimated Total: ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" BTC / $");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("hr");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
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
        var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
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
        var element8 = dom.childAt(fragment, [0]);
        var element9 = dom.childAt(element8, [1]);
        var element10 = dom.childAt(element9, [3]);
        var element11 = dom.childAt(element8, [2]);
        var element12 = dom.childAt(element11, [3]);
        var morph0 = dom.createMorphAt(dom.childAt(element9, [1]),0,0);
        var morph1 = dom.createMorphAt(element10,1,1);
        var morph2 = dom.createMorphAt(element10,3,3);
        var morph3 = dom.createMorphAt(element9,7,7);
        var morph4 = dom.createMorphAt(element9,9,9);
        var morph5 = dom.createMorphAt(element12,1,1);
        var morph6 = dom.createMorphAt(element12,3,3);
        var morph7 = dom.createMorphAt(element11,7,7);
        content(env, morph0, context, "beneficiaries.length");
        content(env, morph1, context, "shareTotal.bits");
        content(env, morph2, context, "shareTotal.usd");
        block(env, morph3, context, "if", [get(env, context, "requestComment")], {}, child0, child1);
        block(env, morph4, context, "unless", [get(env, context, "isDistributing")], {}, child2, null);
        content(env, morph5, context, "collectiveTotal.btc");
        content(env, morph6, context, "collectiveTotal.usd");
        block(env, morph7, context, "if", [get(env, context, "isDistributing")], {}, child3, child4);
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/components/display-comment', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
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
            inline(env, morph0, context, "ago", [get(env, context, "comment.created_utc"), "X"], {});
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
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "link-to", ["btc.address", get(env, context, "addressString")], {"class": "label label-success", "title": get(env, context, "addressString")}, child0, null);
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
          var el1 = dom.createElement("span");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, element = hooks.element, inline = hooks.inline;
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
          var element0 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(element0,0,0);
          element(env, element0, context, "bind-attr", [], {"class": ":label isSigned:label-success:label-default", "title": get(env, context, "addressString")});
          inline(env, morph0, context, "ago", [get(env, context, "comment.created_utc"), "X"], {});
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
          var el1 = dom.createElement("span");
          dom.setAttribute(el1,"class","label label-default");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
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
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
          content(env, morph0, context, "comment.author_flair_text");
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
          var el1 = dom.createComment("");
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
          var morph0 = dom.createUnsafeMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          content(env, morph0, context, "messageHtml");
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
        var el1 = dom.createElement("h4");
        dom.setAttribute(el1,"class","media-heading");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
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
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),0,0);
        var morph1 = dom.createMorphAt(fragment,2,2,contextualElement);
        var morph2 = dom.createMorphAt(fragment,3,3,contextualElement);
        var morph3 = dom.createMorphAt(fragment,4,4,contextualElement);
        content(env, morph0, context, "comment.author");
        block(env, morph1, context, "if", [get(env, context, "isSigned")], {}, child0, child1);
        block(env, morph2, context, "if", [get(env, context, "comment.author_flair_text")], {}, child2, null);
        block(env, morph3, context, "unless", [get(env, context, "hideMessage")], {}, child3, null);
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
define('fairshare-site/templates/components/link-entry', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
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
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","media-left");
            var el2 = dom.createTextNode("\n  ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("a");
            dom.setAttribute(el2,"target","reddit");
            var el3 = dom.createElement("img");
            dom.setAttribute(el3,"class","media-object");
            dom.setAttribute(el3,"alt","...");
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
            var element0 = dom.childAt(fragment, [1, 1]);
            var element1 = dom.childAt(element0, [0]);
            element(env, element0, context, "bind-attr", [], {"href": get(env, context, "item.url")});
            element(env, element1, context, "bind-attr", [], {"src": get(env, context, "item.thumbnail")});
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
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "if", [get(env, context, "thumbnail")], {}, child0, null);
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
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","media-body");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h4");
        dom.setAttribute(el2,"class","media-heading");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","meta");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode(" comments\n    posted ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode(" by ");
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
        var hooks = env.hooks, get = hooks.get, block = hooks.block, inline = hooks.inline, content = hooks.content;
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
        var element2 = dom.childAt(fragment, [2]);
        var element3 = dom.childAt(element2, [3]);
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        var morph1 = dom.createMorphAt(dom.childAt(element2, [1]),0,0);
        var morph2 = dom.createMorphAt(element3,1,1);
        var morph3 = dom.createMorphAt(element3,3,3);
        var morph4 = dom.createMorphAt(element3,5,5);
        dom.insertBoundary(fragment, 0);
        block(env, morph0, context, "if", [get(env, context, "includeThumbnail")], {}, child0, null);
        inline(env, morph1, context, "link-to", [get(env, context, "item.title"), "thread", get(env, context, "item")], {});
        content(env, morph2, context, "item.num_comments");
        inline(env, morph3, context, "ago", [get(env, context, "item.created_utc"), "X"], {});
        content(env, morph4, context, "item.author");
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/components/send-btc', ['exports'], function (exports) {

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
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","input-group");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          dom.setAttribute(el2,"class","input-group-addon");
          var el3 = dom.createTextNode("satoshi");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          dom.setAttribute(el2,"class","input-group-btn");
          var el3 = dom.createTextNode("\n      ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("button");
          var el4 = dom.createTextNode("Send");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline, element = hooks.element;
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
          var element0 = dom.childAt(fragment, [1]);
          var element1 = dom.childAt(element0, [5, 1]);
          var morph0 = dom.createMorphAt(element0,1,1);
          inline(env, morph0, context, "input", [], {"value": get(env, context, "amount"), "class": "form-control", "placeholder": get(env, context, "placeholder")});
          element(env, element1, context, "bind-attr", [], {"class": ":btn isValid:btn-success:btn-danger"});
          element(env, element1, context, "action", ["send"], {});
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
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
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
          var morph1 = dom.createMorphAt(fragment,3,3,contextualElement);
          inline(env, morph0, context, "input", [], {"type": "password", "value": get(env, context, "auth.passPhrase"), "class": "form-control", "placeholder": "FairShare passphrase"});
          inline(env, morph1, context, "input", [], {"type": "password", "value": get(env, context, "auth.passPhraseRepeat"), "class": "form-control", "placeholder": "repeat FairShare passphrase"});
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
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        block(env, morph0, context, "if", [get(env, context, "auth.address")], {}, child0, child1);
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/components/sign-comment', ['exports'], function (exports) {

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
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          inline(env, morph0, context, "textarea", [], {"value": get(env, context, "message"), "placeholder": "message", "class": "form-control"});
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.0",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
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
            var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            inline(env, morph0, context, "input", [], {"type": "password", "value": get(env, context, "auth.passPhrase"), "class": "form-control", "placeholder": "FairShare passphrase", "action": "makeComment"});
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
            var el1 = dom.createElement("button");
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
            var element0 = dom.childAt(fragment, [1]);
            var morph0 = dom.createMorphAt(element0,0,0);
            element(env, element0, context, "bind-attr", [], {"class": ":btn :form-control auth.addressData.total_txs:btn-success:btn-default"});
            element(env, element0, context, "action", ["makeComment"], {});
            content(env, morph0, context, "buttonText");
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
            inline(env, morph0, context, "input", [], {"type": "password", "value": get(env, context, "auth.passPhraseRepeat"), "class": "form-control", "placeholder": "repeat FairShare passphrase", "action": "makeComment"});
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
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","input-group");
          var el2 = dom.createTextNode("\n\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          dom.setAttribute(el2,"class","input-group-btn");
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
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          var morph1 = dom.createMorphAt(fragment,1,1,contextualElement);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "unless", [get(env, context, "auth.addressData.total_txs")], {}, child0, null);
          block(env, morph1, context, "if", [get(env, context, "address")], {}, child1, child2);
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
          var el1 = dom.createElement("h2");
          dom.setAttribute(el1,"class","loading");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
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
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
          content(env, morph0, context, "statusMessage");
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.0",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createElement("pre");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
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
            var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),0,0);
            content(env, morph0, context, "markdown");
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
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","well");
            var el2 = dom.createTextNode("\n  ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("h3");
            var el3 = dom.createTextNode("Your passphrase powers a ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("a");
            dom.setAttribute(el3,"href","https://en.bitcoin.it/wiki/Brainwallet");
            dom.setAttribute(el3,"target","_new");
            var el4 = dom.createTextNode("brainwallet");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n  ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("p");
            var el3 = dom.createTextNode("It is ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("strong");
            var el4 = dom.createTextNode("very important");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode(" when creating a brainwallet to use a passphrase that has a very high level of entropy. If this is not done, theft of the brainwallet is an eventual certainty.");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n  ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("p");
            var el3 = dom.createTextNode("This is not a simple suggestion. This is a requirement. Most people when asked to create a secure password, with everything they've heard about creating a password, will still create a password that if used for a brainwallet, will result in the eventual theft of their funds. ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("strong");
            var el4 = dom.createTextNode("The simple fact of the matter is that hacking a brainwallet password is a mathematical exercise that requires no internet access, no communication, and leaves no trace");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode(", so hackers can collectively try multiple trillions of passwords every second in the privacy of their own homes with the very same equipment they use for mining bitcoins (in the usual sense). Your bank might tell you that a 10 character password with uppercase, lowercase, numbers and symbols is a strong password, but it is not strong enough to secure a brainwallet. A password that might be strong enough for traditional banking or a social website is typically unacceptable for a brainwallet.");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n  ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("p");
            var el3 = dom.createTextNode("A brainwallet passphrase, at a minimum, ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("strong");
            var el4 = dom.createTextNode("needs to be an entirely original sentence that does not appear in any song or literature.");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode(" Security is enhanced simply by including some sort of memorable personal information, which doesn't necessarily even have to be secret (e.g. an e-mail address, or phone number). A good brainwallet passphrase will have dozens of characters.");
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
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "if", [get(env, context, "markdown")], {}, child0, child1);
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
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
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
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        var morph1 = dom.createMorphAt(fragment,1,1,contextualElement);
        var morph2 = dom.createMorphAt(fragment,2,2,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        block(env, morph0, context, "unless", [get(env, context, "fixedMessage")], {}, child0, null);
        block(env, morph1, context, "unless", [get(env, context, "isCommenting")], {}, child1, child2);
        block(env, morph2, context, "unless", [get(env, context, "hideMarkdown")], {}, child3, null);
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/components/subreddit-sidebar', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
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
            var el1 = dom.createElement("li");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, element = hooks.element, content = hooks.content;
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
            var element0 = dom.childAt(fragment, [1]);
            var morph0 = dom.createMorphAt(element0,0,0);
            element(env, element0, context, "bind-attr", [], {"title": get(env, context, "item.publicKey")});
            content(env, morph0, context, "item.user");
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
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("hr");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h4");
          var el2 = dom.createTextNode("Signature Roll");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("ul");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
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
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [5]),1,1);
          block(env, morph0, context, "each", [get(env, context, "subreddit.roll")], {"keyword": "item"}, child0, null);
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
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
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
        var morph0 = dom.createUnsafeMorphAt(fragment,0,0,contextualElement);
        var morph1 = dom.createMorphAt(fragment,2,2,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "subreddit.description_html");
        block(env, morph1, context, "if", [get(env, context, "subreddit.roll.length")], {}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/error', ['exports'], function (exports) {

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
        var el2 = dom.createTextNode("Error");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("pre");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
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
        var morph0 = dom.createMorphAt(fragment,2,2,contextualElement);
        var morph1 = dom.createMorphAt(dom.childAt(fragment, [4]),0,0);
        content(env, morph0, context, "model");
        content(env, morph1, context, "model.stack");
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/index', ['exports'], function (exports) {

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
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, inline = hooks.inline;
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
          inline(env, morph0, context, "link-to", ["Request a FairShare", "ubi"], {"class": "btn btn-primary btn-lg"});
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
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          dom.setAttribute(el1,"class","btn btn-primary btn-lg dontintercept");
          var el2 = dom.createTextNode("Request a FairShare");
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
          var element0 = dom.childAt(fragment, [1]);
          element(env, element0, context, "bind-attr", [], {"href": get(env, context, "auth.loginUrl")});
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
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","row homepage");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-2");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-8");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","jumbotron");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("h1");
        var el5 = dom.createTextNode("Welcome to ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("hr");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("p");
        var el5 = dom.createTextNode("An apolitical approach to ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("a");
        dom.setAttribute(el5,"href","http://reddit.com/r/BasicIncome");
        dom.setAttribute(el5,"target","reddit");
        var el6 = dom.createTextNode("Universal Basic Income");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("p");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("a");
        dom.setAttribute(el5,"href","http://reddit.com/r/FairShare");
        dom.setAttribute(el5,"target","reddit");
        dom.setAttribute(el5,"class","btn btn-primary");
        var el6 = dom.createTextNode("\n          Discuss on reddit\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("hr");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("blockquote");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("p");
        var el6 = dom.createTextNode("We shouldn’t delay forever until every possible feature is done. There’s always going to be one more thing to do.");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("footer");
        var el6 = dom.createTextNode("Satoshi Nakamoto");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-2");
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
        var hooks = env.hooks, inline = hooks.inline, get = hooks.get, block = hooks.block;
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
        var element1 = dom.childAt(fragment, [0, 3, 1]);
        var element2 = dom.childAt(element1, [7]);
        var morph0 = dom.createMorphAt(dom.childAt(element1, [1]),1,1);
        var morph1 = dom.createMorphAt(element2,1,1);
        var morph2 = dom.createMorphAt(element2,3,3);
        inline(env, morph0, context, "link-to", ["FairShare!", "about"], {});
        inline(env, morph1, context, "link-to", ["What is FairShare?", "about"], {"class": "btn btn-primary"});
        block(env, morph2, context, "if", [get(env, context, "auth.user")], {}, child0, child1);
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
        var el1 = dom.createElement("h2");
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
define('fairshare-site/templates/multisig/loading', ['exports'], function (exports) {

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
        var el2 = dom.createTextNode("Loading Thread...");
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
define('fairshare-site/templates/multisig/thread/enroll', ['exports'], function (exports) {

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
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("hr");
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
          inline(env, morph0, context, "sign-comment", [], {"fixedMessage": true, "message": get(env, context, "user.name"), "thingId": get(env, context, "model.name"), "hideMarkdown": true, "buttonText": "Enroll", "statusMessage": "Enrolling...", "comments": get(env, context, "model.comments")});
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
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          dom.setAttribute(el1,"class","media");
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline, content = hooks.content;
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
          var element0 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(element0,1,1);
          var morph1 = dom.createMorphAt(element0,3,3);
          inline(env, morph0, context, "display-comment", [], {"comment": get(env, context, "item.comment"), "hideMessage": true});
          content(env, morph1, context, "item.publicKey");
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
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","row");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-6");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createTextNode("Identity Enrollment");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("hr");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("ul");
        dom.setAttribute(el3,"class","media-list");
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-6");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h2");
        var el4 = dom.createTextNode("Identity Roll Markdown");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("pre");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
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
        var element1 = dom.childAt(fragment, [0]);
        var element2 = dom.childAt(element1, [1]);
        var morph0 = dom.createMorphAt(element2,5,5);
        var morph1 = dom.createMorphAt(dom.childAt(element2, [7]),1,1);
        var morph2 = dom.createMorphAt(dom.childAt(element1, [2, 3]),0,0);
        block(env, morph0, context, "unless", [get(env, context, "isEnrolled")], {}, child0, null);
        block(env, morph1, context, "each", [get(env, context, "commentItems")], {"keyword": "item"}, child1, null);
        content(env, morph2, context, "markdown");
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/privacy', ['exports'], function (exports) {

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
        var el1 = dom.createElement("h1");
        var el2 = dom.createTextNode("Privacy Policy");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h4");
        var el2 = dom.createTextNode("\nThis is separate from\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://www.reddit.com/help/privacypolicy");
        dom.setAttribute(el2,"class","dontintercept");
        var el3 = dom.createTextNode("reddit.com's Privacy Policy");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("This app runs entirely in your browser and never phones home.");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("There is no home to phone, this app is hosted on github pages.");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("No data gets stored or sent back to non-reddit servers.");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("You can verify this using your browser's network inspector.");
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
define('fairshare-site/templates/r/loading', ['exports'], function (exports) {

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
        var el2 = dom.createTextNode("Loading Subreddit...");
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
define('fairshare-site/templates/subreddit', ['exports'], function (exports) {

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
          var el1 = dom.createComment("");
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
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          inline(env, morph0, context, "link-to", [get(env, context, "model.display_name"), "subreddit.index"], {});
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
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, inline = hooks.inline;
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
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          inline(env, morph0, context, "link-to", ["hot", "subreddit.index"], {});
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
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, inline = hooks.inline;
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
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          inline(env, morph0, context, "link-to", ["new", "subreddit.new"], {});
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
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, inline = hooks.inline;
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
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          inline(env, morph0, context, "link-to", ["wiki", "wiki"], {});
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
        var el1 = dom.createElement("ul");
        dom.setAttribute(el1,"class","nav nav-pills");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
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
        var hooks = env.hooks, block = hooks.block, content = hooks.content;
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
        var morph0 = dom.createMorphAt(element0,1,1);
        var morph1 = dom.createMorphAt(element0,3,3);
        var morph2 = dom.createMorphAt(element0,5,5);
        var morph3 = dom.createMorphAt(element0,7,7);
        var morph4 = dom.createMorphAt(fragment,2,2,contextualElement);
        block(env, morph0, context, "link-to", ["subreddit"], {"tagName": "li"}, child0, null);
        block(env, morph1, context, "link-to", ["subreddit.index"], {"tagName": "li"}, child1, null);
        block(env, morph2, context, "link-to", ["subreddit.new"], {"tagName": "li"}, child2, null);
        block(env, morph3, context, "link-to", ["wiki"], {"tagName": "li"}, child3, null);
        content(env, morph4, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/subreddit/index', ['exports'], function (exports) {

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
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          dom.setAttribute(el1,"class","list-group-item");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
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
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
          inline(env, morph0, context, "link-entry", [], {"item": get(env, context, "item")});
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
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","row");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-9");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","panel panel-default");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("ol");
        dom.setAttribute(el4,"class","list-group");
        var el5 = dom.createTextNode("\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-3");
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
        var hooks = env.hooks, get = hooks.get, block = hooks.block, inline = hooks.inline;
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
        var morph0 = dom.createMorphAt(dom.childAt(element0, [1, 1, 1]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(element0, [2]),1,1);
        block(env, morph0, context, "each", [get(env, context, "model")], {"keyword": "item"}, child0, null);
        inline(env, morph1, context, "subreddit-sidebar", [], {"subreddit": get(env, context, "model.subreddit")});
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/subreddit/loading', ['exports'], function (exports) {

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
        dom.setAttribute(el1,"class","loading");
        var el2 = dom.createTextNode("Loading Listing...");
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
define('fairshare-site/templates/thread', ['exports'], function (exports) {

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
          var el1 = dom.createTextNode("    ");
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
          var morph0 = dom.createUnsafeMorphAt(fragment,1,1,contextualElement);
          content(env, morph0, context, "selftext_html");
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
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","panel panel-default");
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","panel-body");
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
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
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline, block = hooks.block, content = hooks.content;
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
        var element0 = dom.childAt(fragment, [0, 0]);
        var morph0 = dom.createMorphAt(element0,1,1);
        var morph1 = dom.createMorphAt(element0,3,3);
        var morph2 = dom.createMorphAt(fragment,2,2,contextualElement);
        inline(env, morph0, context, "link-entry", [], {"item": get(env, context, "model")});
        block(env, morph1, context, "if", [get(env, context, "selftext")], {}, child0, null);
        content(env, morph2, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/thread/loading', ['exports'], function (exports) {

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
        dom.setAttribute(el1,"class","loading");
        var el2 = dom.createTextNode("Loading Comments...");
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
define('fairshare-site/templates/wiki', ['exports'], function (exports) {

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
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","row");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-9");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","panel panel-default");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4,"class","panel-body");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-md-3");
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
        var hooks = env.hooks, content = hooks.content, get = hooks.get, inline = hooks.inline;
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
        var morph0 = dom.createMorphAt(dom.childAt(element0, [1, 1, 1]),0,0);
        var morph1 = dom.createMorphAt(dom.childAt(element0, [2]),1,1);
        content(env, morph0, context, "outlet");
        inline(env, morph1, context, "subreddit-sidebar", [], {"subreddit": get(env, context, "model")});
        return fragment;
      }
    };
  }()));

});
define('fairshare-site/templates/wiki/loading', ['exports'], function (exports) {

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
        dom.setAttribute(el1,"class","loading");
        var el2 = dom.createTextNode("Loading Wiki...");
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
define('fairshare-site/templates/wiki/page', ['exports'], function (exports) {

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
          var el1 = dom.createTextNode("    /r/");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("/wiki/");
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
          var morph1 = dom.createMorphAt(fragment,3,3,contextualElement);
          content(env, morph0, context, "model.subreddit.display_name");
          content(env, morph1, context, "model.title");
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
        var el1 = dom.createElement("h4");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("hr");
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
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        var morph1 = dom.createUnsafeMorphAt(fragment,3,3,contextualElement);
        block(env, morph0, context, "link-to", ["wiki.page", get(env, context, "model.title")], {}, child0, null);
        content(env, morph1, context, "model.content_html");
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
define('fairshare-site/tests/components/display-comment.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/display-comment.js should pass jshint', function() { 
    ok(true, 'components/display-comment.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/components/link-entry.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/link-entry.js should pass jshint', function() { 
    ok(true, 'components/link-entry.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/components/qr-code.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/qr-code.js should pass jshint', function() { 
    ok(true, 'components/qr-code.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/components/send-btc.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/send-btc.js should pass jshint', function() { 
    ok(false, 'components/send-btc.js should pass jshint.\ncomponents/send-btc.js: line 1, col 1, \'QRCode\' is defined but never used.\n\n1 error'); 
  });

});
define('fairshare-site/tests/components/sign-comment.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/sign-comment.js should pass jshint', function() { 
    ok(false, 'components/sign-comment.js should pass jshint.\ncomponents/sign-comment.js: line 42, col 40, Missing semicolon.\ncomponents/sign-comment.js: line 1, col 1, \'moment\' is defined but never used.\n\n2 errors'); 
  });

});
define('fairshare-site/tests/controllers/application.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/application.js should pass jshint', function() { 
    ok(false, 'controllers/application.js should pass jshint.\ncontrollers/application.js: line 2, col 8, \'client\' is defined but never used.\n\n1 error'); 
  });

});
define('fairshare-site/tests/controllers/comments/chain.jshint', function () {

  'use strict';

  module('JSHint - controllers/comments');
  test('controllers/comments/chain.js should pass jshint', function() { 
    ok(true, 'controllers/comments/chain.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/controllers/comments/ubi.jshint', function () {

  'use strict';

  module('JSHint - controllers/comments');
  test('controllers/comments/ubi.js should pass jshint', function() { 
    ok(false, 'controllers/comments/ubi.js should pass jshint.\ncontrollers/comments/ubi.js: line 88, col 42, Missing semicolon.\ncontrollers/comments/ubi.js: line 88, col 43, Unnecessary semicolon.\n\n2 errors'); 
  });

});
define('fairshare-site/tests/controllers/index.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/index.js should pass jshint', function() { 
    ok(true, 'controllers/index.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/controllers/multisig/thread/enroll.jshint', function () {

  'use strict';

  module('JSHint - controllers/multisig/thread');
  test('controllers/multisig/thread/enroll.js should pass jshint', function() { 
    ok(false, 'controllers/multisig/thread/enroll.js should pass jshint.\ncontrollers/multisig/thread/enroll.js: line 3, col 5, Redefinition of \'bitcore\'.\ncontrollers/multisig/thread/enroll.js: line 3, col 15, \'require\' is not defined.\ncontrollers/multisig/thread/enroll.js: line 4, col 15, \'require\' is not defined.\ncontrollers/multisig/thread/enroll.js: line 4, col 5, \'Message\' is defined but never used.\n\n4 errors'); 
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
define('fairshare-site/tests/mixins/comment.jshint', function () {

  'use strict';

  module('JSHint - mixins');
  test('mixins/comment.js should pass jshint', function() { 
    ok(false, 'mixins/comment.js should pass jshint.\nmixins/comment.js: line 54, col 3, Missing semicolon.\n\n1 error'); 
  });

});
define('fairshare-site/tests/router.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('router.js should pass jshint', function() { 
    ok(false, 'router.js should pass jshint.\nrouter.js: line 22, col 8, Expected an assignment or function call and instead saw an expression.\nrouter.js: line 34, col 7, Missing semicolon.\nrouter.js: line 50, col 17, \'parts\' is already defined.\n\n3 errors'); 
  });

});
define('fairshare-site/tests/routes/about-sticky-redirect.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/about-sticky-redirect.js should pass jshint', function() { 
    ok(false, 'routes/about-sticky-redirect.js should pass jshint.\nroutes/about-sticky-redirect.js: line 8, col 22, \'model\' is defined but never used.\n\n1 error'); 
  });

});
define('fairshare-site/tests/routes/application.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/application.js should pass jshint', function() { 
    ok(true, 'routes/application.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/routes/btc/address.jshint', function () {

  'use strict';

  module('JSHint - routes/btc');
  test('routes/btc/address.js should pass jshint', function() { 
    ok(true, 'routes/btc/address.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/routes/comments-thread-redirect.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/comments-thread-redirect.js should pass jshint', function() { 
    ok(false, 'routes/comments-thread-redirect.js should pass jshint.\nroutes/comments-thread-redirect.js: line 12, col 3, Missing semicolon.\n\n1 error'); 
  });

});
define('fairshare-site/tests/routes/comments.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/comments.js should pass jshint', function() { 
    ok(true, 'routes/comments.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/routes/comments/chain.jshint', function () {

  'use strict';

  module('JSHint - routes/comments');
  test('routes/comments/chain.js should pass jshint', function() { 
    ok(false, 'routes/comments/chain.js should pass jshint.\nroutes/comments/chain.js: line 9, col 19, \'args\' is defined but never used.\n\n1 error'); 
  });

});
define('fairshare-site/tests/routes/comments/ubi.jshint', function () {

  'use strict';

  module('JSHint - routes/comments');
  test('routes/comments/ubi.js should pass jshint', function() { 
    ok(false, 'routes/comments/ubi.js should pass jshint.\nroutes/comments/ubi.js: line 21, col 10, Missing semicolon.\nroutes/comments/ubi.js: line 174, col 20, \'moment\' is not defined.\nroutes/comments/ubi.js: line 7, col 25, \'model\' is defined but never used.\nroutes/comments/ubi.js: line 52, col 9, \'post\' is defined but never used.\nroutes/comments/ubi.js: line 69, col 11, \'bits\' is defined but never used.\nroutes/comments/ubi.js: line 183, col 26, \'result\' is defined but never used.\n\n6 errors'); 
  });

});
define('fairshare-site/tests/routes/multisig/thread.jshint', function () {

  'use strict';

  module('JSHint - routes/multisig');
  test('routes/multisig/thread.js should pass jshint', function() { 
    ok(false, 'routes/multisig/thread.js should pass jshint.\nroutes/multisig/thread.js: line 41, col 9, Missing semicolon.\n\n1 error'); 
  });

});
define('fairshare-site/tests/routes/subreddit.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/subreddit.js should pass jshint', function() { 
    ok(true, 'routes/subreddit.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/routes/subreddit/index.jshint', function () {

  'use strict';

  module('JSHint - routes/subreddit');
  test('routes/subreddit/index.js should pass jshint', function() { 
    ok(true, 'routes/subreddit/index.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/routes/subreddit/new.jshint', function () {

  'use strict';

  module('JSHint - routes/subreddit');
  test('routes/subreddit/new.js should pass jshint', function() { 
    ok(true, 'routes/subreddit/new.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/routes/thread.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/thread.js should pass jshint', function() { 
    ok(true, 'routes/thread.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/routes/thread/index.jshint', function () {

  'use strict';

  module('JSHint - routes/thread');
  test('routes/thread/index.js should pass jshint', function() { 
    ok(true, 'routes/thread/index.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/routes/ubi.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/ubi.js should pass jshint', function() { 
    ok(false, 'routes/ubi.js should pass jshint.\nroutes/ubi.js: line 2, col 8, \'client\' is defined but never used.\n\n1 error'); 
  });

});
define('fairshare-site/tests/routes/wiki/index.jshint', function () {

  'use strict';

  module('JSHint - routes/wiki');
  test('routes/wiki/index.js should pass jshint', function() { 
    ok(true, 'routes/wiki/index.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/routes/wiki/page.jshint', function () {

  'use strict';

  module('JSHint - routes/wiki');
  test('routes/wiki/page.js should pass jshint', function() { 
    ok(true, 'routes/wiki/page.js should pass jshint.'); 
  });

});
define('fairshare-site/tests/services/auth.jshint', function () {

  'use strict';

  module('JSHint - services');
  test('services/auth.js should pass jshint', function() { 
    ok(false, 'services/auth.js should pass jshint.\nservices/auth.js: line 16, col 14, Missing semicolon.\nservices/auth.js: line 105, col 46, \'moment\' is not defined.\nservices/auth.js: line 163, col 15, \'err\' is not defined.\nservices/auth.js: line 159, col 65, \'result\' is defined but never used.\n\n4 errors'); 
  });

});
define('fairshare-site/tests/services/bitcore.jshint', function () {

  'use strict';

  module('JSHint - services');
  test('services/bitcore.js should pass jshint', function() { 
    ok(false, 'services/bitcore.js should pass jshint.\nservices/bitcore.js: line 76, col 11, Missing semicolon.\nservices/bitcore.js: line 3, col 15, \'require\' is not defined.\nservices/bitcore.js: line 4, col 15, \'require\' is not defined.\n\n3 errors'); 
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
  require("fairshare-site/app")["default"].create({"name":"fairshare-site","version":"0.0.0.8f41d6d0"});
}

/* jshint ignore:end */
//# sourceMappingURL=fairshare-site.map