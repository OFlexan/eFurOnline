/* init data */
document.querySelector("#sidemenusvg").onclick = function() {
  document.querySelector("#sidemenu").classList.remove("hidden");
  document.querySelector(".coverall").classList.remove("hidden");
};
document.querySelector(".coverall").onclick = function() {
  document.querySelector("#sidemenu").classList.add("hidden");
  document.querySelector(".coverall").classList.add("hidden");
};

(async function() {
  await Glyph.create("outline").prepare("resources/gglyphoutline.ttf", 0xE000);
  await Glyph.create("full").prepare("resources/gglyph.ttf", 0xE000, Glyph.get("outline").getGlyphs());
  Glyph.get("outline").processDocument();
  Glyph.get("full").processDocument();
  
  /* custom data */
  AppData.app = {
    version: {
      app: [94, "1.19.1"],
      api: [94, "1.19.1"],
      web: [2, "1.1"]
    },
    glyphs: {
      favorite: Glyph.get("outline").getString("favorite_border"),
      favorited: Glyph.get("full").getString("favorite"),
      like: Glyph.get("outline").getString("thumb_up_off_alt"),
      liked: Glyph.get("full").getString("thumb_up_alt")
    }
  };

  /* app start */
  AppData.user = unpackObject(Parse.User.current());
  if (AppData.user) login(true);
  else View.switch("login");
})();