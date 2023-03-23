/* init data */
//if (checkMobile()) alert("The website is optimized for computers, please use the app if possible.");
document.querySelector("#sidemenusvg").onclick = function() {
  document.querySelector("#sidemenu").classList.remove("gone");
  document.querySelector(".coverall").classList.remove("hidden");
};
document.querySelector(".coverall").onclick = function() {
  document.querySelector("#sidemenu").classList.add("gone");
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
      web: [3, "1.2"]
    },
    glyphs: {
      favorite: Glyph.get("outline").getString("favorite_border"),
      favorited: Glyph.get("full").getString("favorite"),
      comment: Glyph.get("outline").getString("comment"),
      like: Glyph.get("outline").getString("thumb_up_off_alt"),
      liked: Glyph.get("full").getString("thumb_up_alt"),
      menu: {
        following: Glyph.get("outline").getString("follow_the_signs"),
        new: Glyph.get("outline").getString("fiber_new"),
        discover: Glyph.get("outline").getString("wb_incandescent"),
        messages: Glyph.get("outline").getString("chat_bubble_outline"),
        notifications: Glyph.get("outline").getString("notifications"),
        news: Glyph.get("outline").getString("new_releases"),
        settings: Glyph.get("full").getString("settings"),
        support: Glyph.get("outline").getString("support")
      }
    }
  };

  /* app start */
  AppData.user = unpackObject(Parse.User.current());
  if (AppData.user) login(true);
  else View.switch("login");
})();