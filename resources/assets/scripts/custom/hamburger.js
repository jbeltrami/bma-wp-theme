const toggleNavActive = () => {
  const $nav = $(".navbar");
  const $hamburger = $(".hamburger");

  $nav.toggleClass("active");
  $hamburger.toggleClass("active");
};

$(".hamburger, .nav-item").on("click touch tap", toggleNavActive);
