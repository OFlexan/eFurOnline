Parse.initialize("MiGt7yG9h5WAf7zXRsDHp");
Parse.serverURL = "https://api.efur.app/parse";

var AppData = {
  mode: 2,
  posts: []
};

var View = {
  switch: function(id, skipLoad) {
    var v = document.querySelector(".view");
    if (v) {
      v.classList.remove("view");
      v.classList.add("hiddenview");
      var x = v.querySelector("info");
      if (x) {
        var opt = x.innerText.split(";");
        for (var i = 0; i < opt.length; i++) {
          if (opt[i].split("=")[0] == "include") {
            var r = document.querySelector(opt[i].split("=")[1]);
            if (!r.classList.contains("hidden")) r.classList.add("hidden");
          }
          if (opt[i].split("=")[0] == "hide") {
            var r = document.querySelector(opt[i].split("=")[1]);
            if (r.classList.contains("hidden")) r.classList.remove("hidden");
          }
        }
      }
    }
    var p = document.querySelector("#doc" + id);
    var x = p.querySelector("info");
    if (x) {
      var opt = x.innerText.split(";");
      for (var i = 0; i < opt.length; i++) {
        if (opt[i].split("=")[0] == "reset" && !skipLoad) {
          p.querySelector(opt[i].split("=")[1]).innerHTML = "";
        }
        if (opt[i].split("=")[0] == "include") {
          var r = document.querySelector(opt[i].split("=")[1]);
          if (r.classList.contains("hidden")) r.classList.remove("hidden");
        }
        if (opt[i].split("=")[0] == "hide") {
          var r = document.querySelector(opt[i].split("=")[1]);
          if (!r.classList.contains("hidden")) r.classList.add("hidden");
        }
        if (opt[i].split("=")[0] == "copy" && !skipLoad) {
          p.removeChild(x);
          p.innerHTML = document.querySelector(opt[i].split("=")[1]).innerHTML;
          p.appendChild(x);
        }
      }
    }
    p.classList.remove("hiddenview");
    p.classList.add("view");
  },
  get: function(id) {
    var q = document.querySelector("#doc" + id);
    if (q) return q;
    return document.querySelector("view:not(.hiddenview)");
  },
  ensure: function(id) {
    return !!document.querySelector("#doc" + id + ":not(.hiddenview)");
  }
}

async function login(skipLogin, isGuest) {
  if (!skipLogin && document.querySelector("#safemode").checked) {
    AppData.mode = 0;
    localStorage.setItem("efur$mode", AppData.mode);
  }
  View.switch("load");
  document.querySelector("#loadstatus").innerText = "Fetching account";
  document.querySelector("#loadbar").value = 25;
  
  AppData.mode = +localStorage.getItem("efur$mode");
  if (!AppData.user && !skipLogin) {
    if (isGuest) {
      AppData.user = await Parse.AnonymousUtils.logIn();
      AppData.isGuest = true;
      localStorage.setItem("efur$!guest", false);
    }
    else {
      AppData.user = await Parse.User.logIn(document.querySelector("input[type=email]").value, document.querySelector("input[type=password]").value);
      AppData.isGuest = false;
      localStorage.setItem("efur$!guest", true);
    }
  } else AppData.isGuest = localStorage.getItem("efur$!guest") != "true";
  AppData.loggedIn = true;

  profileLoaded();

  document.querySelector("#loadstatus").innerText = "Fetching configuration";
  document.querySelector("#loadbar").value = 75;
  AppData.config = (await Parse.Config.get()).attributes;
  
  document.querySelector("#loadstatus").innerText = "Fetching account settings";
  document.querySelector("#loadbar").value = 100;
  AppData.settings = await Parse.Cloud.run("getUserSettings");

  feed();
}

async function feed() {
  View.switch("new");
  AppData.lastDate = await loadPosts(AppData.lastDate);
  var t = false;
  document.querySelector("mobile-app").onscroll = async () => {
    if (!View.ensure("new")) return;
    if (!t && document.querySelector("mobile-app").scrollTop + window.innerHeight >= document.querySelector("mobile-app").scrollHeight - 2000) {
      t = true;
      AppData.lastDate = await loadPosts(AppData.lastDate);
      t = false;
    }
  };
}

async function loadPosts(date) {
  var posts = await Parse.Cloud.run("getNewPosts", {r:AppData.mode,d:date});
  for (var i = 0; i < posts.p.length; i++) {
    posts.p[i] = unpackObject(posts.p[i]);
    posts.p[i].u = unpackObject(posts.p[i].u);
    posts.p[i].p = unpackObject(posts.p[i].p);
    if (posts.f.includes(posts.p[i].id)) posts.p[i].fav = true;
    else posts.p[i].fav = false;
  }
  for (var i = 0; i < posts.p.length; i++) {
    AppData.posts.push(posts.p[i]);
    // post data
    var id = posts.p[i].id;
    var rating = posts.p[i].r; // 0 = SAFE, 1 = SUGGESTIVE, 2 = EXPLICIT
    var title = posts.p[i].f;
    var content = posts.p[i].g;
    var desc = posts.p[i].i;
    var source = posts.p[i].s;
    var artist = posts.p[i].e;
    var categories = posts.p[i].c;
    var tags = posts.p[i].t;
    var favorites = posts.p[i].k;
    var comments = posts.p[i].j;
    var favorited = posts.p[i].fav;
    var image = undefined;
    var video = undefined;
    if (posts.p[i].data) {
      image = posts.p[i].data.p;
      video = posts.p[i].data.v;
    }
    var options = [];
    var qstn = undefined;
    var votes = undefined;
    var multi = false;
    if (posts.p[i].p) {
      for (var x = 0; x < posts.p[i].p.o.length; x++) {
        options.push({
          text: posts.p[i].p.o[x],
          amount: posts.p[i].p["s" + x]
        });
      }
      qstn = posts.p[i].p.q;
      votes = posts.p[i].p.s;
      multi = posts.p[i].p.v;
    }

    // user data
    var pfp = posts.p[i].u.i ? posts.p[i].u.i.t : "resources/user_icon.png";
    var name = posts.p[i].u.username;
    var uprofile = (rating == 0 ? [] : (rating == 1 ? ["SUGGESTIVE"] : ["EXPLICIT"]));
    for (var x = 0; x < categories.length; x++) {
      for (var y = 0; y < AppData.config.categories.length; y++) {
        if (AppData.config.categories[y].i == categories[x]) {
          uprofile.push(AppData.config.categories[y].n);
        }
      }
    }
    
    var post = document.createElement("div");
    post.className = "post post-" + id;
    // profile
    // pfp, name, rating, categories, time
    var userclick = ((id) => () => {
      loadProfile(id);
    })(posts.p[i].u.id);
    var header = document.createElement("div");
    header.className = "profheader";
    var pfpd = document.createElement("img");
    pfpd.className = "phpfp";
    pfpd.onclick = userclick;
    pfpd.src = pfp;
    header.appendChild(pfpd);
    var named = document.createElement("p");
    named.className = "phname";
    named.onclick = userclick;
    named.innerText = name;
    header.appendChild(named);
    var uprofiled = document.createElement("p");
    uprofiled.className = "phuprofile";
    uprofiled.innerHTML = uprofile.join(", ");
    header.appendChild(uprofiled);
    post.appendChild(header);
    // post
    if (title !== undefined) {
      var item = document.createElement("p");
      item.className = "title";
      item.innerText = title;
      post.appendChild(item);
    }
    if (content !== undefined) {
      var item = document.createElement("p");
      item.className = "content";
      item.innerText = content;
      post.appendChild(item);
    }
    if (image !== undefined) {
      if (video !== undefined) {
        // video
        var item = document.createElement("video");
        item.className = "video";
        item.innerText = "Your browser does not support the video tag.";
        item.poster = image;
        item.controls = true;
        var src = document.createElement("source");
        src.src = video;
        src.type = "video/mp4";
        item.appendChild(src);
        post.appendChild(item);
      } else {
        // image
        var item = document.createElement("img");
        item.className = "image";
        item.src = image;
        item.onclick = ((image) => () => loadImage(image))(posts.p[i].data.f);
        post.appendChild(item);
      }
    }
    if (votes !== undefined) {
      var poll = document.createElement("div");
      poll.className = "poll";
      if (qstn !== undefined) {
        var item = document.createElement("p");
        item.className = "votetitle";
        item.innerText = qstn;
        poll.appendChild(item);
      }
      var o = [];
      for (var x = 0; x < options.length; x++) {
        var g = {};
        var div = document.createElement("div");
        div.className = "polloption";

        var item = document.createElement("p");
        item.className = "votepct";
        item.setAttribute("data-id", id);
        div.appendChild(item);
        g.a = item;
        item = document.createElement("div");
        item.className = "voteopt" + (multi ? " multi" : "");
        item.setAttribute("data-id", id);
        div.appendChild(item);
        g.b = item;
        item = document.createElement("div");
        item.className = "voteoptin disabled" + (multi ? " multi" : "");
        item.setAttribute("data-id", id);
        g.b.appendChild(item);
        g.x = item;
        item = document.createElement("p");
        item.className = "vote";
        item.innerText = options[x].text;
        item.setAttribute("data-id", id);
        div.appendChild(item);
        g.c = item;
        item = document.createElement("progress");
        item.className = "voteprgs hidden";
        item.value = options[x].amount == 0 ? votes / 60 : options[x].amount;
        item.max = votes;
        item.setAttribute("data-value", options[x].amount);
        item.setAttribute("data-id", id);
        div.appendChild(item);
        g.d = item;
        g.e = div;
        o.push(g);
        div.appendChild(document.createElement("br"));
      
        div.onclick = ((poll, g, multi) => function() {
          if (multi) {
            var c = poll.querySelectorAll(".voteopt.active");
            for (var i = 0; i < c.length; i++) {
              if (c[i] == g.b) {
                c[i].classList.remove("active");
                c[i].querySelector(".voteoptin").classList.add("disabled");
                return;
              }
            }
            g.b.classList.add("active");
            g.x.classList.remove("disabled");
            return;
          }
          var c = poll.querySelector(".voteopt.active");
          if (c) {
            c.classList.remove("active");
            c.querySelector(".voteoptin").classList.add("disabled");
          }
          g.b.classList.add("active");
          g.x.classList.remove("disabled");
        })(poll, g, multi);
        poll.appendChild(div);
        if (x != options.length - 1) poll.appendChild(document.createElement("hr"));
      }
      var item = document.createElement("p");
      var btn = document.createElement("button");
      btn.className = "votebtn";
      btn.innerText = "VOTE";
      btn.onclick = ((o, votes, multi, id, btn, poll, lbl) => async function(e, skip) {
        var send = [];
        var response;
        if (!skip) {
          if (!multi) {
          for (var x = 0; x < o.length; x++) {
            if (o[x].b.classList.contains("active")) {
            await Parse.Cloud.run("voteOnPoll", {
              p: id,
              v: [x]
            });
            }
          }
          } else {
          for (var x = 0; x < o.length; x++) {
            if (o[x].b.classList.contains("active")) send.push(x);
          }
          await Parse.Cloud.run("voteOnPoll", {
            p: id,
            v: send
          });
          }
        }
        response = unpackObject(await Parse.Cloud.run("getPollVote", {
          p: id
        }));
        if (!response) return;
        response.p = unpackObject(response.p);
        response.p.os = response.p.s;
        response.p.s = 0;
        for (var x = 0; x < response.p.o.length; x++) response.p.s += response.p["s" + x];
        
        for (var x = 0; x < o.length; x++) {
          var g = response.p["s" + x];
          var f = Math.floor(g / response.p.s * 100);
          o[x].a.innerText = (isNaN(f) ? 0 : f) + "%";
          o[x].c.classList.add("discovered");
          var v = g == 0 ? response.p.s / 100 : g;
          o[x].d.classList.remove("hidden");
          o[x].d.value = 0;
          setTimeout(((v, d) => () => {
            d.value = v;
          })(v, o[x].d), 100);
          o[x].e.onclick = undefined;
          lbl.innerText = response.p.os + " votes";
        }
        for (var x = 0; x < response.o.length; x++) {
          o[response.o[x]].b.classList.add("active");
          o[response.o[x]].x.classList.remove("disabled");
        }
        poll.removeChild(btn);
      })(o, votes, multi, posts.p[i].p.id, btn, poll, item);
      poll.appendChild(btn);
      item.className = "voteamount";
      item.innerText = votes + " votes";
      poll.appendChild(item);
      post.appendChild(poll);
      btn.onclick(null, true);
    }
    if (artist !== undefined) {
      var item = document.createElement("p");
      item.className = "artist";
      item.innerText = "© " + artist;
      post.appendChild(item);
    }
    if (desc !== undefined) {
      var item = document.createElement("p");
      item.className = "desctitle";
      item.innerText = "Description";
      post.appendChild(item);

      item = document.createElement("p");
      item.className = "desc";
      item.innerText = desc;
      post.appendChild(item);
    }
    var toolbar = document.createElement("div");
    toolbar.className = "posttoolbar";

    var heartSvg = document.createElement("div");
    heartSvg.className = "favcontainer";
    heartSvg.innerHTML = '<svg class="favs" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="-41.625938415527344 -55.81906509399414 424.2640686035156 424.2640686035156" height="26" width="28"><defs><g id="heart"><path d="M0 200 v-200 h200a100,100 90 0,1 0,200a100,100 90 0,1 -200,0z"></path></g></defs><use xlink:href="#heart" id="favtmp" fill="' + (favorited ? "#E70303" : "none") + '" stroke="#E70303" stroke-width="40" transform="rotate(225,150,121)"></use></svg>';
    var heart = document.createElement("p");
    var innerSvg = heartSvg.querySelector("#favtmp");
    innerSvg.id = "";
    heartSvg.onclick = ((innerSvg, id, heart) => async () => {
      if (innerSvg.getAttribute("fill") != "#E70303") {
        innerSvg.setAttribute("fill", "#E70303");
        // favorite
        var r = await Parse.Cloud.run("favPost", {a: true, p: id, z: AppData.app.version.api[0]});
        heart.innerText = r.f ?? 0;
        innerSvg.setAttribute("fill", r.g ? "#E70303" : "none");
        return;
      }
      innerSvg.setAttribute("fill", "none");
      // unfavorite
      var r = await Parse.Cloud.run("favPost", {a: false, p: id, z: AppData.app.version.api[0]});
      heart.innerText = r.f ?? 0;
      innerSvg.setAttribute("fill", r.g ? "#E70303" : "none");
    })(innerSvg, id, heart);
    heart.className = "favcount";
    heart.innerText = favorites ?? 0;
    heartSvg.appendChild(heart);
    
    var commentSvg = document.createElement("div");
    commentSvg.className = "favcontainer";
    commentSvg.innerHTML = '<svg class="favs" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="-15 -15 310 320" height="26" width="28"><defs><g id="comment"><path d="M0 20c0-10 10-20 20-20l240 0c10 0 20 10 20 20l0 230L240 210l-220 0c-10 0-20-10-20-20l0-170M60 60l160 0M60 150l160 0M60 105l160 0"></path></g></defs><use xlink:href="#comment" fill="none" stroke="white" stroke-width="30"></use></svg>';
    commentSvg.onclick = ((id, post, hasImg, title, header) => () => {
      View.switch("post");
      post.classList.add("diff");
      var h = post.querySelector(".profheader");
      h.querySelector(".phpfp").onclick = header.querySelector(".phpfp").onclick;
      h.querySelector(".phname").onclick = header.querySelector(".phname").onclick;
      h.classList.add("diff");
      post.removeChild(h);
      if (hasImg) {
        var img = post.querySelector("img");
        post.removeChild(img);
        post.innerHTML = "";
        post.appendChild(img);
      }
      if (title !== null) {
        title = title.cloneNode(true);
        post.innerHTML = "";
        title.className = "title";
        post.appendChild(title);
      }
      post.appendChild(h);
      document.querySelector("#post").appendChild(post);
      document.querySelector("#commentsection").style.minHeight = "calc(100% - " + (h.clientHeight + 7) + "px)";
      document.querySelector("mobile-app").scrollTop = document.querySelector("mobile-app").scrollHeight;

      loadComments(undefined, id);
    })(id, post.cloneNode(true), !!image, post.querySelector(".votetitle"), header);
    var comment = document.createElement("p");
    comment.className = "favcount";
    comment.innerText = comments ?? 0;
    commentSvg.appendChild(comment);

    toolbar.appendChild(heartSvg);
    toolbar.appendChild(commentSvg);
    // favorites, comments, info
    post.appendChild(toolbar);

    document.querySelector("#posts").appendChild(post);
    date = +posts.p[i].createdAt;
  }
  return date;
}

async function loadComments(sub, id) {
  var comments = await Parse.Cloud.run("getComments", {c: sub, p: id});
  for (var i = 0; i < comments.c.length; i++) {
    comments.c[i] = unpackObject(comments.c[i]);
    comments.c[i].u = unpackObject(comments.c[i].u);
    if (comments.f.includes(comments.c[i].id)) comments.c[i].fav = true;
    else comments.c[i].fav = false;
  }

  for (var i = 0; i < comments.c.length; i++) {
    // comment data
    var id = comments.c[i].id;
    var content = comments.c[i].t;
    var likes = comments.c[i].s;
    var replies = comments.c[i].q;
    var created = comments.c[i].createdAt;
    var updated = comments.c[i].updatedAt;
    var liked = comments.c[i].fav;

    // user data
    var pfp = comments.c[i].u.i ? comments.c[i].u.i.t : "resources/user_icon.png";
    var name = comments.c[i].u.username;

    // comment
    var userclick = ((id) => () => {
      loadProfile(id);
    })(comments.c[i].u.id);
    var comment = document.createElement("div");
    comment.className = "comment comment-" + id;
    var header = document.createElement("div");
    header.className = "cmtheader";
    var dpfp = document.createElement("img");
    dpfp.className = "cmtpfp";
    dpfp.onclick = userclick;
    dpfp.src = pfp;
    var dname = document.createElement("p");
    dname.className = "cmtname";
    dname.onclick = userclick;
    dname.innerText = name;
    // ...
    header.appendChild(dpfp);
    header.appendChild(dname);
    comment.appendChild(header);

    var text = document.createElement("p");
    text.innerText = content;
    text.className = "cmttext";
    comment.appendChild(text);

    var toolbar = document.createElement("div");
    toolbar.className = "cmttoolbar";
    var likeSvg = document.createElement("p");
    likeSvg.className = comments.f.includes(id) ? "cmtcontainer glyph-full liked" : "cmtcontainer glyph-outline";
    likeSvg.innerText = comments.f.includes(id) ? AppData.app.glyphs.liked : AppData.app.glyphs.like;
    var like = document.createElement("p");
    likeSvg.onclick = ((innerSvg, id, like) => async () => {
      if (!innerSvg.classList.contains("liked")) {
        innerSvg.className = "cmtcontainer glyph-full liked";
        innerSvg.innerText = AppData.app.glyphs.liked;
        like.innerText = +like.innerText + 1;
        // favorite
        var r = await Parse.Cloud.run("favComment", {a: true, c: id, z: AppData.app.version.api[0]});
        like.innerText = r.s ?? 0;
        return;
      }
      innerSvg.className = "cmtcontainer glyph-outline";
      innerSvg.innerText = AppData.app.glyphs.like;
      like.innerText = +like.innerText - 1;
      // unfavorite
      var r = await Parse.Cloud.run("favComment", {a: false, c: id, z: AppData.app.version.api[0]});
      like.innerText = r.s ?? 0;
    })(likeSvg, id, like);
    like.className = "favcount";
    like.innerText = likes ?? 0;
    toolbar.appendChild(likeSvg);
    toolbar.appendChild(like);
    comment.appendChild(toolbar);

    document.querySelector("#commentsection").appendChild(comment);
  }
}

async function loadProfile(id) {
  var v = View.get().id.replace("doc", "");
  View.switch("profile");
  var profile = unpackObject(await Parse.Cloud.run("getUserProfile", {u: id}));
  for (var i = 0; i < profile.ia.length; i++) profile.ia[i] = unpackObject(profile.ia[i]);
  for (var i = 0; i < profile.ib.length; i++) profile.ib[i] = unpackObject(profile.ib[i]);
  var view = View.get("profile");
  
  view.querySelector(".dp_background").src = profile.b ? profile.b.p : "resources/user_background.png";
  view.querySelector(".dp_background").onclick = () => loadImage(view.querySelector(".dp_background").src);
  view.querySelector(".dp_foreground").src = profile.a ? profile.a.p : "resources/user_icon.png";
  view.querySelector(".dp_foreground").onclick = () => loadImage(view.querySelector(".dp_foreground").src);
  view.querySelectorAll(".dp_tsvgs")[0].onclick = ((v) => () => View.switch(v, true))(v);
  view.querySelector(".dp_name").innerText = profile.u;
  view.querySelectorAll(".dp_count")[0].innerText = profile.c;
  view.querySelectorAll(".dp_count")[1].innerText = profile.d;
  view.querySelectorAll(".dp_count")[2].innerText = profile.h;
  view.querySelector(".dp_member").innerText = "MEMBER FOR " + formatDate(Date.now() - profile.s, 2).toUpperCase();
  registerSelectionbar(view.querySelector(".selectionbar"));
}

function loadImage(image) {
  var v = View.get().id.replace("doc", "");
  View.switch("image");
  View.get().querySelector("img").src = image;
  View.get().onclick = ((v) => () => {
    View.switch(v, true);
  })(v);
}

function registerSelectionbar(bar) {
  var q = bar.querySelectorAll("p.selection");
  for (var i = 0; i < q.length; i++) {
    q[i].onclick = ((bar, v) => () => {
      var f = bar.querySelector("p.selection.active");
      if (f) f.classList.remove("active");
      v.classList.add("active");
      v.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    })(bar, q[i]);
  }
}

function unpackObject(obj) {
  if (!obj || !obj.attributes) return obj;
  var a = obj.attributes;
  var k = Object.keys(a);
  for (var i = 0; i < k.length; i++) obj[k[i]] = a[k[i]];
  return obj;
}

function ensureLoggedIn(func) {
  if (!AppData.isGuest) return func();
  showError("An account is needed to perform this action!", true);
}

function showError(text, login) {
  // error
}

function formatDate(time, format) {
  var secs = Math.floor(time / 1000);
  var mins = Math.floor(time / 60000);
  var hours = Math.floor(time / 3600000);
  var days = Math.floor(time / 86400000);
  if (days != 0) return days + (format == 2 ? " days" : (format == 1 ? " d" : "d"));
  if (hours != 0) return hours + (format == 2 ? " hours" : (format == 1 ? " h" : "h"));
  if (mins != 0) return mins + (format == 2 ? " minutes" : (format == 1 ? " m" : "m"));
  if (secs != 0) return secs + (format == 2 ? " seconds" : (format == 1 ? " s" : "s"));
  return 0 + (format == 2 ? " seconds" : (format == 1 ? " s" : "s"));
}

function profileLoaded() {
  var c = () => {
    loadProfile(AppData.user.id);
    document.querySelector("#sidemenu").classList.add("hidden");
    document.querySelector(".coverall").classList.add("hidden");
  };
  document.querySelector(".smbg").src = AppData.user.b ? AppData.user.b.p : "resources/user_background.png";
  document.querySelector(".smfg").src = AppData.user.i ? AppData.user.i.p : "resources/user_icon.png";
  document.querySelector(".smbg").onclick = c;
  document.querySelector(".smfg").onclick = c;
}

function checkMobile() {
  let check = false;
  (function(a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};