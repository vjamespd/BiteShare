// script.js
// when input is clicked, placeholder will removed
document.getElementById('message').addEventListener('focus', function() {
    this.setAttribute('placeholder', '');
  });
  
  document.getElementById('message').addEventListener('blur', function() {
    this.setAttribute('placeholder', 'Message');
  });
  