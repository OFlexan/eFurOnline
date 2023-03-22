const Glyph = (() => {
	var profiles = {};
	return {
		get: function(i) {
			return profiles[i];
		},
		create: function(x) {
			var font;
			var id = x;
			var glyphs = {};
			var v = {
				prepare: async function(f, s, g) {
					font = await opentype.parse(await fetch(f).then(res => res.arrayBuffer()));
					var o = Object.keys(font.glyphs.glyphs).length;
					var q;
					if (g) q = Object.keys(g);
					for (var i = 0; i < o; i++) {
						if (font.glyphs.glyphs[i].unicode < s) continue;
						if (g) {
							glyphs[q.find(key => g[key] == font.glyphs.glyphs[i].unicode) ?? "NONAME" + i] = font.glyphs.glyphs[i].unicode;
							continue;
						}
						glyphs[font.glyphs.glyphs[i].name ?? "NONAME" + i] = font.glyphs.glyphs[i].unicode;
					}
				},
				getIcon: function(i) {
					return glyphs[i];
				},
				getString: function(i) {
					return String.fromCodePoint(this.getIcon(i));
				},
				searchIcon: function(s) {
					var f = [];
					var o = Object.keys(font.glyphs.glyphs).length;
					for (var i = 0; i < o; i++) {
						if (font.glyphs.glyphs[i].unicode < 57344) continue;
						if (font.glyphs.glyphs[i].name && font.glyphs.glyphs[i].name.includes(s)) f.push({
							name: font.glyphs.glyphs[i].name,
							icon: font.glyphs.glyphs[i].unicode
						});
					}
					return f;
				},
				getGlyphs: function() {
					return glyphs;
				},
				create: function(n, a, r) {
					var g = document.createElement("p");
					g.innerText = r ? n : this.getString(n);
					g.className = "glyph-" + id;
					if (a) a.appendChild(g);
					return g;
				},
				processDocument: function() {
					var g = document.querySelectorAll(".glyph-" + id);
					for (var i = 0; i < g.length; i++) {
						var c = g[i].getAttribute("glyph");
						if (g[i].innerText == "" && c) g[i].innerText = this.getString(c);
					}
				}
			};
			profiles[x] = v;
			return v;
		}
	}
})();