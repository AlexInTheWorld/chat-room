$(document).ready(function () {
  var body_element = document.querySelector("body");
  var messages_ul = document.getElementById("messages");
  const vh = $('#messages').css("height").replace("px","");

  function get_scrollH(el) {
    return el.scrollHeight - el.scrollTop;
  }

  $('.emoji').bind('click', function(event) {
    var text = $('#m').val();
    text += event.target.textContent;
    $("#m").val( text );
  })
  /*global io*/
  let socket = io();

  socket.on('user', data => {
    let pre_scrolldistance = get_scrollH(messages_ul);
    let message =
      data.name +
      (data.connected ? ' has joined the chat.' : ' has left the chat.');

    if (data.name) {
      $('#num-users').text(data.currentUsers + ' users online');
      $('#messages').append($('<li>').html('<b>' + message + '</b>'));
      if (data.connected) {
        $('li').last().addClass('user-entered');
      } else {
        $('li').last().addClass('user-left');
      }
      
      if (pre_scrolldistance <= vh) {
        messages_ul.scrollTop = messages_ul.scrollHeight;
      }
    } else {
      $('#num-users').text( 'Not connected' );
    }

});

  socket.on('chat message', (data) => {
    
    let authorship, author;
    let pre_scrollTop = get_scrollH(messages_ul);
    let msg_author = $('#user_id').text() 
    if (data.reader == msg_author) {
      authorship = 'owner';
      author = 'You';
    } else {
      authorship = 'reader';
      author = data.name;
    }

    if (data.name) {

      $('#messages').append($('<li>'));
      let time = Date.now();
      let date_obj = new Date(time);
      let data_arr = [("0" + date_obj.getHours()).slice(-2) + ":" + ("0" + date_obj.getMinutes()).slice(-2), author + ":", data.message];
      
      for (let i = 0; i < data_arr.length; i++) {
        $("li").last().append(`<p class="p-${i}">${data_arr[i]}</p>`);
      }

      $('li').last().addClass(`msg ${authorship}`);
      
      if (pre_scrollTop <= vh) {
        messages_ul.scrollTop = messages_ul.scrollHeight;
      }
    }
    
  });
 
  // Form submission with new message in field with id 'm'
  $('form').submit(function () {
      var messageToSend = $('#m').val();
      //send message to server here?
      socket.emit('chat message', messageToSend);
      $('#m').val('');
      return false; // prevent form submit from refreshing page
  });
});
