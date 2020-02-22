const toggleClassesOnCollapse = () => {
  $('#services-acc').on('show.bs.collapse', e => {
    $(e.target).toggleClass('open');
  });
};

export default toggleClassesOnCollapse;
