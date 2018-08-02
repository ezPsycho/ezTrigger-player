//Notice: Load this module after 'ez://init.js', on the bottom of <body>.

window.ezNirsTrigger = {};

window.ezNirsTrigger.mk = mk => {
  window.ezTrigger.sendData(`MK ${mk}`);
};

window.ezNirsTrigger.export = fn => {
  window.ezTrigger.sendData(`EX ${fn}`);
};

window.ezNirsTrigger.start = () => {
  window.ezTrigger.sendData('ST');
};

window.ezNirsTrigger.stop = () => {
  window.ezTrigger.sendData('EN');
};

window.ezNirsTrigger.lock = () => {
  window.ezTrigger.sendData('LK');
};

window.ezNirsTrigger.unlock = () => {
  window.ezTrigger.sendData('UL');
};