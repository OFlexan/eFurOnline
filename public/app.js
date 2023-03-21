Parse.initialize("MiGt7yG9h5WAf7zXRsDHp");
Parse.serverURL = "https://api.efur.app/parse";

var AppData = {
	mode: 2,
	posts: [],
	version: {
	  app: [94, "1.19.1"],
	  api: [0, "1.19.1"],
	  web: [1, "1"]
	}
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
	document.querySelector("#loadstatus").innerText = "Initializing";
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
		var header = document.createElement("div");
		header.className = "profheader";
		var pfpd = document.createElement("img");
		pfpd.className = "phpfp";
		pfpd.src = pfp;
		header.appendChild(pfpd);
		var named = document.createElement("p");
		named.className = "phname";
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
					var v = g == 0 ? response.p.s / 60 : g;
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
		heartSvg.innerHTML = '<svg class="favs" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="-41.625938415527344 -55.81906509399414 424.2640686035156 424.2640686035156" height="26" width="28"><defs><g id="heart"><path d="M0 200 v-200 h200a100,100 90 0,1 0,200a100,100 90 0,1 -200,0z"></path></g></defs><use xlink:href="#heart" id="favtmp" fill="none" stroke="#E70303" stroke-width="40" transform="rotate(225,150,121)"></use></svg>';
		var innerSvg = heartSvg.querySelector("#favtmp");
		innerSvg.id = "";
		heartSvg.onclick = ((innerSvg) => () => {
			if (innerSvg.getAttribute("fill") != "#E70303") {
				innerSvg.setAttribute("fill", "#E70303");
			} else innerSvg.setAttribute("fill", "none");
		})(innerSvg);
		var heart = document.createElement("p");
		heart.className = "favcount";
		heart.innerText = favorites ?? 0;
		heartSvg.appendChild(heart);
		
		var commentSvg = document.createElement("div");
		commentSvg.className = "favcontainer";
		commentSvg.innerHTML = '<svg class="favs" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="-15 -15 310 320" height="26" width="28"><defs><g id="comment"><path d="M0 20c0-10 10-20 20-20l240 0c10 0 20 10 20 20l0 230L240 210l-220 0c-10 0-20-10-20-20l0-170M60 60l160 0M60 150l160 0M60 105l160 0"></path></g></defs><use xlink:href="#comment" fill="none" stroke="white" stroke-width="30"></use></svg>';
		commentSvg.onclick = ((id, post, hasImg, title) => () => {
			View.switch("post");
			post.classList.add("diff");
			var h = post.querySelector(".profheader");
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
			document.querySelector("#commentsection").style.height = "calc(100% - " + (h.clientHeight + 7) + "px)";
			document.querySelector("mobile-app").scrollTop = document.querySelector("mobile-app").scrollHeight;
		})(id, post.cloneNode(true), !!image, post.querySelector(".votetitle"));
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

function unpackObject(obj) {
	if (!obj || !obj.attributes) return obj;
	var a = obj.attributes;
	var k = Object.keys(a);
	for (var i = 0; i < k.length; i++) obj[k[i]] = a[k[i]];
	return obj;
}

AppData.user = unpackObject(Parse.User.current());
if (AppData.user) login(true);
else View.switch("login");