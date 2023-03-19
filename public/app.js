var AppData = {
	mode: 2
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
	}
}

async function login(skipLoad) {
	View.switch("load");
	document.querySelector("#loadstatus").innerText = "Initializing";
	document.querySelector("#loadbar").value = 25;
	
	var email = document.querySelector("input[type=email]").value;
	var passw = document.querySelector("input[type=password]").value;
	AppData.account = await fetch("https://efur.flexan.cf/parse/login", {
		body: JSON.stringify({
			_method: "GET",
			username: email,
			password: passw
		}),
		method: "POST"
	}).then((j) => j.json());
	AppData.token = AppData.account.sessionToken;
	
	document.querySelector("#loadstatus").innerText = "Fetching account";
	document.querySelector("#loadbar").value = 50;
	// todo: fetch account

	document.querySelector("#loadstatus").innerText = "Fetching configuration";
	document.querySelector("#loadbar").value = 75;
	AppData.config = await fetch("https://efur.flexan.cf/parse/config", {
		headers: {
			"X-Parse-Session-Token": AppData.token
		}
	}).then((j) => j.json());
	AppData.settings = await fetch("https://efur.flexan.cf/parse/functions/getUserSettings", {
		headers: {
			"X-Parse-Session-Token": AppData.token
		},
		body: JSON.stringify({
			z: 85
		}),
		method: "POST"
	}).then((j) => j.json());
	
	document.querySelector("#loadstatus").innerText = "Fetching account settings";
	document.querySelector("#loadbar").value = 100;
	// todo: fetch account settings

	if (!skipLoad) AppData.posts = await fetch("https://efur.flexan.cf/parse/functions/getNewPosts", {
		headers: {
			"X-Parse-Session-Token": AppData.token
		},
		body: JSON.stringify({
			d: Date.now(),
			r: AppData.mode, // 0 = SFW (max safe), 2 = NSFW (max explicit)
			z: 85
		}),
		method: "POST"
	}).then((j) => j.json());

	feed();
}

async function feed() {
	View.switch("new");

	for (var i = 0; i < AppData.posts.result.p.length; i++) {
		// post data
		var id = AppData.posts.result.p[i].objectId;
		var rating = AppData.posts.result.p[i].r; // 0 = SAFE, 1 = SUGGESTIVE, 2 = EXPLICIT
		var title = AppData.posts.result.p[i].f;
		var content = AppData.posts.result.p[i].g;
		var desc = AppData.posts.result.p[i].i;
		var source = AppData.posts.result.p[i].s;
		var artist = AppData.posts.result.p[i].e;
		var categories = AppData.posts.result.p[i].c; // located in AppData.config.params.categories
		var tags = AppData.posts.result.p[i].t;
		var image = undefined;
		var video = undefined;
		if (AppData.posts.result.p[i].data) {
			image = AppData.posts.result.p[i].data.p;
			video = AppData.posts.result.p[i].data.v;
		}
		var options = [];
		var qstn = undefined;
		var votes = undefined;
		var multi = false;
		if (AppData.posts.result.p[i].p) {
			for (var x = 0; x < AppData.posts.result.p[i].p.o.length; x++) {
				options.push({
					text: AppData.posts.result.p[i].p.o[x],
					amount: AppData.posts.result.p[i].p["s" + x]
				});
			}
			qstn = AppData.posts.result.p[i].p.q;
			votes = AppData.posts.result.p[i].p.s;
			multi = AppData.posts.result.p[i].p.v;
		}

		// user data
		var pfp = AppData.posts.result.p[i].u.i ? AppData.posts.result.p[i].u.i.t : "resources/user_icon.png";
		var name = AppData.posts.result.p[i].u.username;
		var uprofile = (rating == 0 ? [] : (rating == 1 ? ["SUGGESTIVE"] : ["EXPLICIT"]));
		for (var x = 0; x < categories.length; x++) {
			for (var y = 0; y < AppData.config.params.categories.length; y++) {
				if (AppData.config.params.categories[y].i == categories[x]) {
					uprofile.push(AppData.config.params.categories[y].n);
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
			btn.onclick = ((o, votes, multi) => function() {
				var send = [];
				if (multi) {
					for (var x = 0; x < o.length; x++) {
						if (o[x].b.classList.contains("active")) send.push(o[x]);
					}
				}
				for (var x = 0; x < o.length; x++) {
					if (!multi && o[x].b.classList.contains("active")) {
						// send data (single)
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
					// send data (multi)
				}
			})(o, votes, multi);
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
		// favorites, comments, info
		post.appendChild(toolbar);

		document.querySelector("#posts").appendChild(post);
	}
}
