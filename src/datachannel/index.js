import '../common';
import 'popper.js';
import { checkAnRun, zg, userID, logout, enterRoom, publish, l3 } from '../common';
import {protobuf} from "protobufjs"


let msgCount = 0;
let localUserList= [];
let datachannelList = {}
const preDataChannelID = "datachannel"
$(async () => {
    await checkAnRun();

    //zg.enableMultiRoom(true);

    zg.off('roomUserUpdate');
    zg.on('roomUserUpdate', (roomID, updateType, userList) => {
        console.warn(
            `roomUserUpdate: room ${roomID}, user ${updateType === 'ADD' ? 'added' : 'left'} `,
            JSON.stringify(userList),
        );
        if (updateType === 'ADD') {
            localUserList.push(...userList);
        } else if (updateType === 'DELETE') {
            userList.forEach(user => {
                localUserList = localUserList.filter(item => item.userID !== user.userID);
            });
        }
        let userListHtml = '';
        localUserList.forEach(user => {
            user.userID !== userID && (userListHtml += `<option value= ${user.userID}>${user.userName}</option>`);
        });
        $('#memberList').html(userListHtml);
    });

    zg.off('roomStreamUpdate');
    zg.on('roomStreamUpdate', async (roomID, updateType, streamList, extendedData) => {
      console.warn('roomStreamUpdate 1 roomID ', roomID, streamList, extendedData);
      // let queue = []
      if (updateType == 'ADD') {
          for (let i = 0; i < streamList.length; i++) {
              console.info(streamList[i].streamID + ' was added');

              if (!streamList[i].streamID.includes('webrtc')) continue;

              let remoteStream;
              let playOption = {};

              if ($("#videoCodec").val()) playOption.videoCodec = $("#videoCodec").val();
              if (l3 == true) playOption.resourceMode = 2;

              zg.startPlayingStream(streamList[i].streamID, playOption).then(stream => {
                  remoteStream = stream;
                  useLocalStreamList.push(streamList[i]);
                  let videoTemp = $(`<video id=${streamList[i].streamID} autoplay muted playsinline controls></video>`)
                  //queue.push(videoTemp)
                  $('.remoteVideo').append(videoTemp);
                  const video = $('.remoteVideo video:last')[0];
                  console.warn('video', video, remoteStream);
                  video.srcObject = remoteStream;
                  video.muted = false;
                  // videoTemp = null;
              }).catch(err => {
                  console.error('err', err);
              });

          }
          // const inIphone = browser.versions.mobile && browser.versions.ios
          // const inSafari = browser.versions.webApp
          // const inWx = browser.versions.weixin
          // if(streamList.length > 1 && (inIphone || inSafari || inWx)) {
          //     const ac = zc.zegoWebRTC.ac;
          //     ac.resume();
          //     const gain = ac.createGain();

          //     while(queue.length) {
          //         let temp = queue.shift()
          //         if(temp.srcObject) {
          //             queue.push(ac.createMediaStreamSource(temp.srcObject))
          //         } else {
          //             temp.connect(gain)
          //         }
          //     }
          //     gain.connect(ac.destination);
          // }
      } else if (updateType == 'DELETE') {
          for (let k = 0; k < useLocalStreamList.length; k++) {
              for (let j = 0; j < streamList.length; j++) {
                  if (useLocalStreamList[k].streamID === streamList[j].streamID) {
                      try {
                          zg.stopPlayingStream(useLocalStreamList[k].streamID);
                      } catch (error) {
                          console.error(error);
                      }

                      console.info(useLocalStreamList[k].streamID + 'was devared');


                      $('.remoteVideo video:eq(' + k + ')').remove();
                      useLocalStreamList.splice(k--, 1);
                      break;
                  }
              }
          }
      }
  });

    $('.chatBox').hide();

    //打开/关闭聊天框
    $('.chatBtn').click(function() {
        $('.chatBox').toggle();
        $('.chatBox-kuang').toggle();

        //聊天框默认最底部
        $('#chatBox-content-demo').scrollTop($('#chatBox-content-demo')[0].scrollHeight);
    });

    // 发送信息
    $('.div-textarea').bind('keydown', e => {
        e.keyCode == 13 && $('#chat-fasong').click() && e.preventDefault();
    });
    $('#leaveRoom').unbind('click');
    $('#leaveRoom').click(function() {
        localUserList = [];
        $('#toast')[0].className = "toast fade hide"
        logout();

        $('#preAndPub')[0].disabled = true;
    });

    $('#createRoom').unbind('click')
    $('#createRoom').click(async () => {
      let loginSuc = false;
      const roomID  = $('#roomId').val();
      try {
          loginSuc = await enterRoom();
          datachannelList[roomID] = {manager: undefined, pubList: [], subList: []}
          datachannelList[roomID].manager = zg.createRealTimeSequentialDataManager(roomID);
          loginSuc && (await publish());
      } catch (error) {
          console.error(error);
      }
    });

    $('#openRoom').unbind('click')
    $('#openRoom').click(async () => {
        const roomID = $('#roomId').val();
        await enterRoom();
        datachannelList[roomID] = {manager: undefined, pubList: [], subList: []}
        datachannelList[roomID].manager = zg.createRealTimeSequentialDataManager(roomID);

        $('#preAndPub')[0].disabled = false;
    });

    $('#startBroadcasting').click(async () => {
        const roomID  = $('#roomId').val();
        const dataChannel = datachannelList[roomID];

        if ($('#pubChannelID').val().length == 0) {
          alert("广播ID 不能为空");
          return;
        }

        const pubChannelID =  $('#pubChannelID').val();

        if (dataChannel) {
          const result = await dataChannel.manager.startBroadcasting(pubChannelID);
          if (result) {
            console.warn("广播成功 " + pubChannelID);
            dataChannel.pubList.push(pubChannelID);
          } else {
            console.error("广播失败 " + pubChannelID)
          }
        } else {
          alert('datachannel no found');
        }
    })

    $('#startSubscribing').click(async () => {
      const roomID  = $('#roomId').val();
      const dataChannel = datachannelList[roomID];

      if ($('#subChannelID').val().length == 0) {
        alert("订阅ID 不能为空");
        return;
      }

      const subChannelID = $('#subChannelID').val();

      if (dataChannel) {
        const result = await dataChannel.manager.startSubscribing(subChannelID);
        if (result) {
          console.warn("订阅成功 " + subChannelID);
          dataChannel.manager.off("recvRealtimeSequentialData");
          dataChannel.manager.on(
            "recvRealtimeSequentialData",
            (byte, dataLength, streamID) => {
              console.error(byte, dataLength, streamID);
            }
          );
        } else {
          console.error("订阅失败 " + subChannelID)
        }
      } else {
        alert('datachannel no found');
      }
    })

    $('#stopBroadcasting').click(async () => {
      const roomID  = $('#roomId').val();
      const dataChannel = datachannelList[roomID];

      if ($('#pubChannelID').val().length == 0) {
        alert("广播ID 不能为空");
        return;
      }

      const pubChannelID = $('#pubChannelID').val();

      if (dataChannel) {
        dataChannel.manager.stopBroadcasting(pubChannelID);
        dataChannel.pubList = dataChannel.pubList.filter(channelID => channelID !== pubChannelID);
      } else {
        alert('datachannel no found');
      }
    })

    $('#stopSubscribing').click(async () => {
      const roomID  = $('#roomId').val();
      const dataChannel = datachannelList[roomID];

      if ($('#subChannelID').val().length == 0) {
        alert("订阅ID 不能为空");
        return;
      }

      const subChannelID = $('#subChannelID').val();

      if (dataChannel) {
        dataChannel.manager.stopSubscribing(subChannelID);
        dataChannel.subList = dataChannel.subList.filter(channelID => channelID !== subChannelID);
      } else {
        alert('datachannel no found');
      }
    })

    $('#sendMessage').click(async () => {
      const roomID  = $('#roomId').val();
      const dataChannel = datachannelList[roomID];
      const pubChannelID = $('#pubChannelID').val();

      const arr = new ArrayBuffer(1200);
      const uint8 = new Uint8Array(arr);
      uint8[0] = 1;
      uint8[1] = 2;
      uint8[2] = 3;
      uint8[1199] = 4;

      if (dataChannel) {
        dataChannel.manager.sendRealTimeSequentialData(pubChannelID, arr);
      } else {
        alert('datachannel no found');
      }
    })

    $('#preAndPub').click(async () => {
      await publish();
    })
});
