Parse.initialize("MiGt7yG9h5WAf7zXRsDHp");
Parse.serverURL = "https://api.efur.app/parse";

var AppData = {
	mode: 2,
	posts: [],
	version: {
	  i: 94,
	  t: "1.19.1"
	}
};

var View = {
	switch: function(id) {
		var p = document.querySelector("#doc" + id);
		var i = p.querySelector("info");
		if (i) {
			var opt = i.innerText.split(";");
			for (var i = 0; i < opt.length; i++) {
				if (opt[i].split("=")[0] == "reset") {
					p.querySelector(opt[i].split("=")[1]).innerHTML = "";
				}
			}
		}
		var v = document.querySelector(".view");
		v.classList.remove("view");
		v.classList.add("hiddenview");
		p.classList.remove("hiddenview");
		p.classList.add("view");
	},
	get: function(id) {
		var q = document.querySelector("#doc" + id);
		if (q) return q;
		return document.querySelector("view:not(.hiddenview)");
	}
}

async function login(skipLogin) {
	if (document.querySelector("#safemode").checked) AppData.mode = 0;
	View.switch("load");
	document.querySelector("#loadstatus").innerText = "Initializing";
	document.querySelector("#loadbar").value = 25;
	
	if (!AppData.user && !skipLogin) {
		AppData.user = await Parse.User.logIn(document.querySelector("input[type=email]").value, document.querySelector("input[type=password]").value);
	}

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
	document.querySelector("app").onscroll = async () => {
		if (!t && document.querySelector("app").scrollTop + window.innerHeight >= document.querySelector("app").scrollHeight - 2000) {
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
		post.className = "post";
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
			var btn = document.createElement("button");
			btn.className = "votebtn";
			btn.innerText = "VOTE";
			btn.onclick = ((o, votes, multi, id, btn) => function() {
				var send = [];
				if (multi) {
					for (var x = 0; x < o.length; x++) {
						if (o[x].b.classList.contains("active")) send.push(x);
					}
				}
				for (var x = 0; x < o.length; x++) {
					if (!multi && o[x].b.classList.contains("active")) {
						Parse.Cloud.run("voteOnPoll", {
							p: id,
							v: [x]
						});
					}
					o[x].a.innerText = Math.round(+o[x].d.getAttribute("data-value") / votes * 100) + "%";
					o[x].c.classList.add("discovered");
					var v = o[x].d.value;
					o[x].d.classList.remove("hidden");
					o[x].d.value = 0;
					setTimeout(((v, d) => () => {
						d.value = v;
					})(v, o[x].d), 1);
					o[x].e.onclick = undefined;
				}
				if (multi) {
					Parse.Cloud.run("voteOnPoll", {
						p: id,
						v: send
					});
				}
				poll.removeChild(btn);
			})(o, votes, multi, posts.p[i].p.id, btn);
			poll.appendChild(btn);
			var item = document.createElement("p");
			item.className = "voteamount";
			item.innerText = votes + " votes";
			poll.appendChild(item);
			post.appendChild(poll);
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
		var heart = document.createElement("input");
		heart.type = "checkbox";
		heart.className = "checkbox";
		heart.id = "checkbox";
		var heartSvg = document.createElement("label");
		heartSvg.setAttribute("for", "checkbox");
		heartSvg.innerHTML = '<svg id="heart-svg" viewBox="467 392 58 57" width="90" height="90" xmlns="http://www.w3.org/2000/svg"><g id="Group" fill="none" fill-rule="evenodd" transform="translate(467 392)"><path id="heart" d="M29.144 20.773c-.063-.13-4.227-8.67-11.44-2.59C7.63 28.795 28.94 43.256 29.143 43.394c.204-.138 21.513-14.6 11.44-25.213-7.214-6.08-11.377 2.46-11.44 2.59z" fill="#AAB8C2"/><circle id="main-circ" fill="#E2264D" opacity="0" cx="29.5" cy="29.5" r="1.5"/><g id="grp7" opacity="0" transform="translate(7 6)"><circle id="oval1" fill="#9CD8C3" cx="2" cy="6" r="2"/><circle id="oval2" fill="#8CE8C3" cx="5" cy="2" r="2"/></g><g id="grp6" opacity="0" transform="translate(0 28)"><circle id="oval1" fill="#CC8EF5" cx="2" cy="7" r="2"/><circle id="oval2" fill="#91D2FA" cx="3" cy="2" r="2"/></g><g id="grp3" opacity="0" transform="translate(52 28)"><circle id="oval2" fill="#9CD8C3" cx="2" cy="7" r="2"/><circle id="oval1" fill="#8CE8C3" cx="4" cy="2" r="2"/></g><g id="grp2" opacity="0" transform="translate(44 6)"><circle id="oval2" fill="#CC8EF5" cx="5" cy="6" r="2"/><circle id="oval1" fill="#CC8EF5" cx="2" cy="2" r="2"/></g><g id="grp5" opacity="0" transform="translate(14 50)"><circle id="oval1" fill="#91D2FA" cx="6" cy="5" r="2"/><circle id="oval2" fill="#91D2FA" cx="2" cy="2" r="2"/></g><g id="grp4" opacity="0" transform="translate(35 50)"><circle id="oval1" fill="#F48EA7" cx="6" cy="5" r="2"/><circle id="oval2" fill="#F48EA7" cx="2" cy="2" r="2"/></g><g id="grp1" opacity="0" transform="translate(24)"><circle id="oval1" fill="#9FC7FA" cx="2.5" cy="3" r="2"/><circle id="oval2" fill="#9FC7FA" cx="7.5" cy="2" r="2"/></g></g></svg>';
		toolbar.appendChild(heart);
		toolbar.appendChild(heartSvg);
		// favorites, comments, info
		post.appendChild(toolbar);

		document.querySelector("#posts").appendChild(post);
		date = +posts.p[i].createdAt;
	}
	return date;
}

function unpackObject(obj) {
	if (!obj || !obj.attributes) return;
	var a = obj.attributes;
	var k = Object.keys(a);
	for (var i = 0; i < k.length; i++) obj[k[i]] = a[k[i]];
	return obj;
}

AppData.user = Parse.User.current();
if (AppData.user) login(true);
