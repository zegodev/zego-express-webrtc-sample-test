import '../common';
import 'popper.js';
import './css/chat.css';
import './font_Icon/iconfont.css';
import { checkAnRun, zg, userID, logout, loginRoom, login, login2, getToken, scenario } from '../common';


let msgCount = 0;
let localUserList= [];
let localStream1 = null;
let localStream2 = null;
let localStream3 = null;
let roomList = [];

let room1Token, room2Token, room3Token;

let useLocalStreamList = [];

let roomMaxUser = {

};

let publishTimes = {};
let loginTimes = {};
let publishRooms = {};
let publishStream = {}
let oldScenario = scenario;

$(async () => {
    await checkAnRun();

    $('#roomScenario').val(scenario)

    function handleRoomList (updateType, roomID) {
        if (updateType === 'ADD') {
            roomList.push(roomID);
        } else if (updateType === 'DELETE') {
            roomList = roomList.filter(item => item !== roomID);
        }
        let roomListHtml = '';
        roomList.forEach(room => {
            roomListHtml += `<option value= ${room}>${room}</option>`;
        });
        $('#selectRoom').html(roomListHtml);

    }

    function play(playVideos, streamID) {
        let remoteStream;
        let playOption = {};

        if ($("#videoCodec").val()) playOption.videoCodec = $("#videoCodec").val();
        // if (l3 == true) playOption.resourceMode = 2;

        zg.startPlayingStream(streamID, playOption).then(stream => {
            remoteStream = stream;
            useLocalStreamList.push({streamID});
            let videoTemp = $(`<video id=${streamID} autoplay muted playsinline controls></video>`)
            //queue.push(videoTemp)

            $(`.${playVideos}`).append(videoTemp);
            const video = $(`.${playVideos} video:last`)[0];
            console.warn('video', video, remoteStream);
            video.srcObject = remoteStream;
            video.muted = false;
            // videoTemp = null;
        }).catch(err => {
            console.error('err', err);
        });

    }

    function stopPlay(streamID) {
        for (let k = 0; k < useLocalStreamList.length; k++) {
            if (useLocalStreamList[k].streamID === streamID) {
                try {
                    zg.stopPlayingStream(streamID);
                } catch (error) {
                    console.error(error);
                }

                console.info(useLocalStreamList[k].streamID + 'was devared');


                $(`#${useLocalStreamList[k].streamID}`).remove();
                useLocalStreamList.splice(k--, 1);
                break;
            }
        }
    }
    zg.on(
        'IMRecvBroadcastMessage',
        (_roomID, chatData) => {
            console.log('IMRecvBroadcastMessage roomID ', _roomID, chatData);
            // const chatBox = `
            //       <div class="clearfloat">
            //         <div class="author-name"><small class="chat-date">${new Date().toLocaleString()}</small></div>
            //         <div class="left">
            //             <div class="chat-avatars"><img src="${require('./img/icon01.png')}" alt="头像"></div>
            //             <div class="chat-message">${chatData[0].message}</div>
            //         </div>
            //     </div>
            //     `;

            // $('.chatBox-content-demo').append(chatBox);
            // //发送后清空输入框
            // $('.div-textarea').html('');
            // //聊天框默认最底部
            // $('#chatBox-content-demo').scrollTop($('#chatBox-content-demo')[0].scrollHeight);

            // msgCount++;
            // $('.chat-message-num').text(msgCount);
            // $('.chatBox').show();
            // $('.chatBox-kuang').show();
        },
    );
    zg.off('IMRecvBarrageMessage');
    zg.on(
        'IMRecvBarrageMessage',
        (_roomID, chatData) => {
            console.log('IMRecvBarrageMessage roomID ', _roomID, chatData);
            $('#toastBody').text(`IMRecvBarrageMessage from ${chatData[0].fromUser.userID} message: ${chatData[0].message}`);
            $('#toast')[0].className = "toast fade show"
        },
    );
    zg.off('IMRecvCustomCommand');
    zg.on('IMRecvCustomCommand', (_roomID, fromUser, command) => {
        console.log('IMRecvCustomCommand roomID ', _roomID, ' ', fromUser.userID, ' send ', command);
        $('#toastBody').text( 'IMRecvCustomCommand from' + ' ' + fromUser.userID + ' send ' + command);
        $('#toast')[0].className = "toast fade show"
    });
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
            let playVideos;
            const roomId1 = $('#roomId1').val();
            if (roomID === roomId1) {
                playVideos = 'remoteVideo1';
                if($("#playAutoRoom1").val() == '0') {
                    console.warn('不自动拉流');
                    return;
                }
            }

            const roomId2 = $('#roomId2').val();
            if (roomID === roomId2) {
                playVideos = 'remoteVideo2';
                if($("#playAutoRoom2").val() == '0') {
                    console.warn('不自动拉流');
                    return;
                }
            }

            const roomId3 = $('#roomId3').val();
            if (roomID === roomId3) {
                playVideos = 'remoteVideo3';
                if($("#playAutoRoom3").val() == '0') {
                    console.warn('不自动拉流');
                    return;
                }
            }

            for (let i = 0; i < streamList.length; i++) {
                console.info(streamList[i].streamID + ' was added');
                let remoteStream;
                let playOption = {};

                if ($("#videoCodec").val()) playOption.videoCodec = $("#videoCodec").val();
                // if (l3 == true) playOption.resourceMode = 2;

                zg.startPlayingStream(streamList[i].streamID, playOption).then(stream => {
                    remoteStream = stream;
                    useLocalStreamList.push(streamList[i]);
                    let videoTemp = $(`<video id=${streamList[i].streamID} autoplay muted playsinline controls></video>`)
                    //queue.push(videoTemp)

                    $(`.${playVideos}`).append(videoTemp);
                    const video = $(`.${playVideos} video:last`)[0];
                    console.warn('video', video, remoteStream);
                    video.srcObject = remoteStream;
                    video.muted = false;
                    // videoTemp = null;
                }).catch(err => {
                    console.error('err', err);
                });

            }

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


                        $(`#${useLocalStreamList[k].streamID}`).remove();
                        useLocalStreamList.splice(k--, 1);
                        break;
                    }
                    publishStream[roomID] && (delete publishStream[roomID][streamList[j].streamID])
                }
            }
        }
    });
    zg.off('roomExtraInfoUpdate')
    zg.on('roomExtraInfoUpdate', (roomID, extraInfoList) => {
        console.warn(`roomExtraInfo: room ${roomID} `, extraInfoList);
        $('#toastBody').text(`${extraInfoList[0].key} ${extraInfoList[0].value}`)
        $('#toast')[0].className = "toast fade show"
    });

    zg.off('tokenWillExpire')
    zg.on("tokenWillExpire", (roomID) => {
        console.warn(`tokenWillExpire ${roomID}`);
    });
    zg.off('publisherStateUpdate');
    zg.on('publisherStateUpdate', result => {
        console.warn('publisherStateUpdate: ', result.streamID, result.state, result);
        if (result.state == 'PUBLISHING') {
            console.info(' publish  success ' + result.streamID);
            const now = new Date().getTime();
            const pushConsumed = now - publishTimes[result.streamID];
            console.warn("推流耗时 " + pushConsumed);

            const publishConsumed = now - loginTimes[publishRooms[result.streamID]];
            console.warn('登录推流耗时 ' + publishConsumed);

            if (window.publishTimes[result.streamID]) {
                const publishRetryConsumed = now - publishTimes[result.streamID];
                console.warn('推流节点耗时 ' + publishRetryConsumed)
                delete window.publishTimes[result.streamID];;
            }

        } else if (result.state == 'PUBLISH_REQUESTING') {
            console.info(' publish  retry');
            if (result.errorCode !== 0 && !window.publishTimes[result.streamID]) {
                window.publishTimes[result.streamID] = new Date().getTime();
            }
        } else {
            delete window.publishTimes[result.streamID];
            if (result.errorCode == 0) {
                console.warn('publish stop ' + result.errorCode + ' ' + result.extendedData);
            } else {
                console.error('publish error ' + result.errorCode + ' ' + result.extendedData);
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

    $('#chat-fasong').click(async () => {
        if (!loginRoom) {
            alert('no login rooom');
            return;
        }
        const textContent = $('.div-textarea')
            .html()
            .replace(/[\n\r]/g, '<br>');
        if (textContent) {
            const roomId= $('#roomId').val() ;
            if (!roomId) {
                alert('roomId is empty');
                return false;
            }
            const result = await zg.sendBroadcastMessage(roomId, textContent);
            console.log('', result);
            if (result.errorCode === 0) {
                console.warn('send Message success');
            } else {
                console.error('send Message fail ', result.errorCode);
            }

            $('.chatBox-content-demo').append(`
                                    <div class="clearfloat">
                                       <div class="author-name">
                                          <small class="chat-date"> ${new Date().toLocaleString()}</small>
                                       </div>
                                       <div class="right">
                                          <div class="chat-message"> ${textContent} </div>
                                          <div class="chat-avatars">
                                              <img src="${require('./img/icon02.png')}" alt="头像" />
                                          </div>
                                       </div>
                                  </div>
                        `);
            //发送后清空输入框
            $('.div-textarea').html('');
            //聊天框默认最底部
            $('#chatBox-content-demo').scrollTop($('#chatBox-content-demo')[0].scrollHeight);
        }
    });

    $('#BroadcastMessage').click(async () => {

        const roomId= $('#selectRoom').val() ;
        const msg = $('#msgContent').val();
        if(!msg) {
            alert('消息内容为空');
            return
        }
        const result = await zg.sendBroadcastMessage(roomId, msg);
        if (result.errorCode === 0) {
            console.warn('sendBroadcastMessage suc');
        } else {
            console.error('sendBroadcastMessage err', result.errorCode);
        }
    });

    $('#sendCustomrMsg').click(async () => {

        const roomId= $('#selectRoom').val() ;
        const msg = $('#msgContent').val();
        if(!msg) {
            alert('消息内容为空');
            return
        }

        const customers = $('#customers').val();
        if(!customers) {
            alert('自定义用户为空');
            return
        }
        const members = customers.split(',')
        const result = await zg.sendCustomCommand(roomId, msg, members);
        if (result.errorCode === 0) {
            console.warn('sendCustomCommand suc');
        } else {
            console.error('sendCustomCommand err', result.errorCode);
        }
    });

    $('#BarrageMessage').click(async () => {

        const roomId= $('#selectRoom').val() ;
        const msg = $('#msgContent').val();
        if(!msg) {
            alert('消息内容为空');
            return
        }
        const result = await zg.sendBarrageMessage(roomId, msg);
        console.log('', result);
        if (result.errorCode === 0) {
            console.warn('send BarrageMessage success');
        } else {
            console.error('send BarrageMessage fail ', result.errorCode);
        }
    });

    $('#ReliableMessage').click(async () => {
        const roomId= $('#selectRoom').val();
        const msg = $('#roomExtras').val();

        const content = msg.split('=');
        const result = await zg.setRoomExtraInfo(roomId, content[0], content[1]);
        if (result.errorCode === 0) {
            console.warn('setRoomExtraInfo suc');
        } else {
            console.error('setRoomExtraInfo err', result.errorCode);
        }
    });


    $('#enableMulti').click(function() {
        const enable = zg.enableMultiRoom(true);
        if (enable) {
            alert('开启多房间成功');
        }
    });

    $('#setRoomCount').click(function() {
        const roomId = $('#maxUserRoomId').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        const maxCount = $('#maxUserCount').val();
        if (!maxCount) {
            alert('maxUserCount is empty');
            return false;
        }
        roomMaxUser[roomId] = parseInt(maxCount);
    });


    $('#createTokenRoom1').click(async function() {
        const roomId = $('#roomId1').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        const time = $('#roomId1_expireTime').val();
        if (!time) {
            alert('time is empty');
            return false;
        }
        const expireTime = parseInt(time);
        try {
            //  console.error(userID, roomId)
             room1Token = await getToken(userID, roomId, expireTime);
             $("#room1Token").val(room1Token)

        } catch (error) {
            console.error(error)
        }
    });

    $('#enterRoom1').click(async function() {
        const roomId = $('#roomId1').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        loginTimes[roomId] = new Date().getTime();
        room1Token = $('#room1Token').val().trim()
        try {
            if (room1Token) {
                await login2(room1Token, roomId, { maxMemberCount: roomMaxUser[roomId] || 0, userUpdate: true });
                room1Token = '';
                $("#room1Token").val('')
            } else {
                await login(roomId, { maxMemberCount: roomMaxUser[roomId] || 0, userUpdate: true});
            }
            handleRoomList('ADD', roomId)
        } catch (error) {

        }
    });

    $('#renewTokenRoom1').click(async function() {
        const roomId = $('#roomId1').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        const time = $('#roomId1_expireTime').val();
        if (!time) {
            alert('time is empty');
            return false;
        }
        const expireTime = parseInt(time);
        const token = await getToken(userID, roomId, expireTime)
        room1Token = token
        $("#room1Token").val(room1Token)
        zg.renewToken(token, roomId);
    });

    $('#leaveRoom1').click(function() {
        const roomId = $('#roomId1').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }

        localStream1 && zg.destroyStream(localStream1);
        localStream1 = null;
        const previewVideo1 = $('#room1PreviewVideo1')[0];
        previewVideo1 && (previewVideo1.srcObject = null);

        const previewVideo2 = $('#room1PreviewVideo2')[0];
        previewVideo2 && (previewVideo2.srcObject = null);

        $('.remoteVideo1').empty();
        zg.logoutRoom(roomId);
        handleRoomList('DELETE', roomId)
    });
    function getVideoConfig() {
        const config = {}
        let videoQuality = $("#videoQuality").val();
        if(videoQuality) {
            videoQuality = Number(videoQuality)
            config.videoQuality = videoQuality
        }
        if(videoQuality == 4) {
            const width = $('#width').val()
            const height = $('#height').val()
            const frameRate = $('#frameRate').val()
            const bitrate = $('#bitrate').val()
            width && (config.width = parseInt(width) || JSON.parse(width))
            height && (config.height = parseInt(height) || JSON.parse(height))
            frameRate && (config.frameRate = parseInt(frameRate) || JSON.parse(frameRate))
            bitrate && (config.bitrate = parseInt(bitrate) || JSON.parse(bitrate))
        }
        return config
    }
    function getAudioConfig() {
        const config = {}
        $('#noiseSuppression').val() === '1' ? (config.ANS = true) : (config.ANS = false);
        $('#autoGainControl').val() === '1' ? (config.AGC = true) : (config.AGC = false);
        $('#echoCancellation').val() === '1' ? (config.AEC = true) : (config.AEC = false);
        return config
    }
    function getStreamConfig() {
        const config = {...getVideoConfig(), ...getAudioConfig()}
        $('#audioBitrate').val() && (config.audioBitrate = parseInt($('#audioBitrate').val()));
        return config
    }
    $('#setVideoConfig').click(function() {
        const streamID = $("#publishingID").val()
        const roomID = $("#publishingRoomID").val()
        if(!roomID || !publishStream[roomID]) {
            return alert('please enter the right room ID')
        }
        if(!streamID) {
            return alert('please enter stream ID')
        }
        const stream = publishStream[roomID][streamID]
        const config = getStreamConfig()
        config.maxBitrate = config.bitrate
        zg.setVideoConfig(stream, config)
    })
    $('#setAudioConfig').click(function() {
        const streamID = $("#publishingID").val()
        const roomID = $("#publishingRoomID").val()
        if(!roomID || !publishStream[roomID]) {
            return alert('please enter the right room ID')
        }
        if(!streamID) {
            return alert('please enter stream ID')
        }
        const stream = publishStream[roomID][streamID]
        zg.setAudioConfig(stream, getAudioConfig())
    })
    $('#roomScenario').change(function(e) {
        const scenario = e.currentTarget.value;
        if(scenario) {
            const result = zg.setRoomScenario(Number(scenario))
            if(result) {
                // 重置参数
                $('#width').val('')
                $('#height').val('')
                $('#frameRate').val('')
                $('#bitrate').val('')
                $('#noiseSuppression').val('1')
                $('#autoGainControl').val('1')
                $('#echoCancellation').val('1')
                $('#audioBitrate').val('')
                $("#videoQuality").val('')
                oldScenario = scenario
            } else {
                $('#roomScenario').val(oldScenario)
            }
        }
    })
    $('#publishRoom1Stream1').click(async function() {
        const streamId = $('#roomId1_streamId1').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }
        const roomId = $('#roomId1').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        if (!localStream1) {
            localStream1 = await zg.createStream({camera: getStreamConfig()});
        }
        let previewVideo1 = $('#room1PreviewVideo1')[0];
        previewVideo1.srcObject = localStream1;

        publishTimes[streamId] = new Date().getTime();
        publishRooms[streamId] = roomId;
        zg.startPublishingStream(streamId, localStream1, { roomID: roomId });
        if(!publishStream[roomId]) {
            publishStream[roomId] = {}
        }
        publishStream[roomId][streamId] = localStream1

    });

    $('#publishRoom1Stream2').click(async function() {
        const streamId = $('#roomId1_streamId2').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }
        const roomId = $('#roomId1').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        if (!localStream1) {
            localStream1 = await zg.createStream({camera: getStreamConfig()});
        }

        let previewVideo1 = $('#room1PreviewVideo2')[0];
        previewVideo1.srcObject = localStream1;

        publishTimes[streamId] = new Date().getTime();
        publishRooms[streamId] = roomId;

        zg.startPublishingStream(streamId, localStream1, { roomID: roomId });
        if(!publishStream[roomId]) {
            publishStream[roomId] = {}
        }
        publishStream[roomId][streamId] = localStream1
    });


    $('#stopPublishRoom1Stream1').click(async function() {

        const streamId = $('#roomId1_streamId1').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }
        zg.stopPublishingStream(streamId);
        let previewVideo1 = $('#room1PreviewVideo1')[0];
        previewVideo1.srcObject = null;
        localStream1 = null;
    });

    $('#stopPublishRoom1Stream2').click(async function() {

        const streamId = $('#roomId1_streamId2').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }
        zg.stopPublishingStream(streamId);
        let previewVideo1 = $('#room1PreviewVideo2')[0];
        previewVideo1.srcObject = null;
        localStream1 = null;
    });

    $('#playRoom1Stream').click(function() {
        const streamId = $('#roomId1_play_streamId').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }

        play('remoteVideo1', streamId);
    });

    $('#stopPlayRoom1Stream').click(function() {
        const streamId = $('#roomId1_play_streamId').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }

        stopPlay(streamId);
    });

    $('#createTokenRoom2').click(async function() {
        const roomId = $('#roomId2').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        const time = $('#roomId2_expireTime').val();
        if (!time) {
            alert('time is empty');
            return false;
        }
        const expireTime = parseInt(time);
        try {
            //  console.error(userID, roomId)
             room2Token = await getToken(userID, roomId, expireTime);
             $("#room2Token").val(room2Token)
        } catch (error) {
            console.error(error)
        }
    });

    $('#enterRoom2').click(async function() {
        const roomId = $('#roomId2').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        loginTimes[roomId] = new Date().getTime();
        room2Token = $('#room2Token').val().trim()
        try {
            if (room2Token) {
                await login2(room2Token, roomId, { maxMemberCount: roomMaxUser[roomId] || 0, userUpdate: true });
                room2Token = '';
                $("#room2Token").val('')
            } else {
                await login(roomId, { maxMemberCount: roomMaxUser[roomId] || 0, userUpdate: true});
            }
            handleRoomList('ADD', roomId)
        } catch (error) {

        }
    });

    $('#renewTokenRoom2').click(async function() {
        const roomId = $('#roomId2').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        const time = $('#roomId2_expireTime').val();
        if (!time) {
            alert('time is empty');
            return false;
        }
        const expireTime = parseInt(time);
        const token = await getToken(userID, roomId, expireTime)
        room2Token = token;
        $('#room2Token').val(room2Token)
        zg.renewToken(token, roomId);
    });

    $('#leaveRoom2').click(function() {
        const roomId = $('#roomId2').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }

        localStream2 && zg.destroyStream(localStream2)
        localStream2 = null;
        const previewVideo1 = $('#room2PreviewVideo1')[0];
        previewVideo1 && (previewVideo1.srcObject = null);

        const previewVideo2 = $('#room2PreviewVideo2')[0];
        previewVideo2 && (previewVideo2.srcObject = null);

        $('.remoteVideo2').empty();

        zg.logoutRoom(roomId);
        handleRoomList('DELETE', roomId)

    });

    $('#publishRoom2Stream1').click(async function() {
        const streamId = $('#roomId2_streamId1').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }
        const roomId = $('#roomId2').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        if (!localStream2) {
            localStream2 = await zg.createStream({camera: getStreamConfig()});
        }

        let previewVideo1 = $('#room2PreviewVideo1')[0];
        previewVideo1.srcObject = localStream2;

        publishTimes[streamId] = new Date().getTime();
        publishRooms[streamId] = roomId;

        zg.startPublishingStream(streamId, localStream2, { roomID: roomId});
        if(!publishStream[roomId]) {
            publishStream[roomId] = {}
        }
        publishStream[roomId][streamId] = localStream2

    });

    $('#publishRoom2Stream2').click(async function() {
        const streamId = $('#roomId2_streamId2').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }
        const roomId = $('#roomId2').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        if (!localStream2) {
            localStream2 = await zg.createStream({camera: getStreamConfig()});
        }

        let previewVideo1 = $('#room2PreviewVideo2')[0];
        previewVideo1.srcObject = localStream2;

        publishTimes[streamId] = new Date().getTime();
        publishRooms[streamId] = roomId;

        zg.startPublishingStream(streamId, localStream2, { roomID: roomId });
        if(!publishStream[roomId]) {
            publishStream[roomId] = {}
        }
        publishStream[roomId][streamId] = localStream2
    });

    $('#stopPublishRoom2Stream1').click(async function() {

        const streamId = $('#roomId2_streamId1').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }
        zg.stopPublishingStream(streamId);
        let previewVideo1 = $('#room2PreviewVideo1')[0];
        previewVideo1.srcObject = null;
        localStream2 = null;
    });

    $('#stopPublishRoom2Stream2').click(async function() {

        const streamId = $('#roomId2_streamId2').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }
        zg.stopPublishingStream(streamId);
        let previewVideo1 = $('#room2PreviewVideo2')[0];
        previewVideo1.srcObject = null;
        localStream2 = null;
    });


    $('#playRoom2Stream').click(function() {
        const streamId = $('#roomId2_play_streamId').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }

        play('remoteVideo2', streamId);
    });

    $('#stopPlayRoom2Stream').click(function() {
        const streamId = $('#roomId2_play_streamId').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }

        stopPlay(streamId);
    });

    $('#createTokenRoom3').click(async function() {
        const roomId = $('#roomId3').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        const time = $('#roomId3_expireTime').val();
        if (!time) {
            alert('time is empty');
            return false;
        }
        const expireTime = parseInt(time);
        try {
            //  console.error(userID, roomId)
             room3Token = await getToken(userID, roomId, expireTime);
             $("#room3Token").val(room3Token)
        } catch (error) {
            console.error(error)
        }
    });

    $('#enterRoom3').click(async function() {
        const roomId = $('#roomId3').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        loginTimes[roomId] = new Date().getTime();
        room3Token = $('#room3Token').val().trim();
        try {
            if (room3Token) {
                await login2(room3Token, roomId, { maxMemberCount: roomMaxUser[roomId] || 0, userUpdate: true });
                room3Token = '';
                $('#room3Token').val('')
            } else {
                await login(roomId, { maxMemberCount: roomMaxUser[roomId] || 0, userUpdate: true});
            }
            handleRoomList('ADD', roomId)
        } catch (error) {

        }
    });

    $('#renewTokenRoom3').click(async function() {
        const roomId = $('#roomId3').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        const time = $('#roomId3_expireTime').val();
        if (!time) {
            alert('time is empty');
            return false;
        }
        const expireTime = parseInt(time);
        const token = await getToken(userID, roomId, expireTime)
        room3Token = token;
        $('#room3Token').val(token)
        zg.renewToken(token, roomId);
    });

    $('#leaveRoom3').click(function() {
        const roomId = $('#roomId3').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }

        localStream3 && zg.destroyStream(localStream3)
        localStream3 = null;
        const previewVideo1 = $('#room3PreviewVideo1')[0];
        previewVideo1 && (previewVideo1.srcObject = null);

        const previewVideo2 = $('#room3PreviewVideo2')[0];
        previewVideo2 && (previewVideo2.srcObject = null);

        $('.remoteVideo3').empty();

        zg.logoutRoom(roomId);
        handleRoomList('DELETE', roomId)

    });

    $('#publishRoom3Stream1').click(async function() {
        const streamId = $('#roomId3_streamId1').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }
        if (!localStream3) {
            localStream3 = await zg.createStream({camera: getStreamConfig()});
        }
        const roomId = $('#roomId3').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        let previewVideo1 = $('#room3PreviewVideo1')[0];
        previewVideo1.srcObject = localStream3;

        publishTimes[streamId] = new Date().getTime();
        publishRooms[streamId] = roomId;

        zg.startPublishingStream(streamId, localStream3, {roomID: roomId });
        if(!publishStream[roomId]) {
            publishStream[roomId] = {}
        }
        publishStream[roomId][streamId] = localStream3

    });

    $('#publishRoom3Stream2').click(async function() {
        const streamId = $('#roomId3_streamId2').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }
        if (!localStream3) {
            localStream3 = await zg.createStream({camera: getStreamConfig()});
        }
        const roomId = $('#roomId3').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        let previewVideo1 = $('#room3PreviewVideo2')[0];
        previewVideo1.srcObject = localStream3;

        publishTimes[streamId] = new Date().getTime();
        publishRooms[streamId] = roomId;

        zg.startPublishingStream(streamId, localStream3, { roomID: roomId });
        if(!publishStream[roomId]) {
            publishStream[roomId] = {}
        }
        publishStream[roomId][streamId] = localStream3
    });

    $('#stopPublishRoom3Stream1').click(async function() {

        const streamId = $('#roomId3_streamId1').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }
        zg.stopPublishingStream(streamId);
        let previewVideo1 = $('#room3PreviewVideo1')[0];
        previewVideo1.srcObject = null;
        localStream3 = null;
    });

    $('#stopPublishRoom3Stream2').click(async function() {

        const streamId = $('#roomId3_streamId2').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }
        zg.stopPublishingStream(streamId);
        let previewVideo1 = $('#room3PreviewVideo1')[0];
        previewVideo1.srcObject = null;
        localStream3 = null;
    });

    $('#playRoom3Stream').click(function() {
        const streamId = $('#roomId3_play_streamId').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }

        play('remoteVideo3', streamId);
    });

    $('#stopPlayRoom3Stream').click(function() {
        const streamId = $('#roomId3_play_streamId').val();
        if (!streamId) {
            alert('streamId is empty');
            return false;
        }

        stopPlay(streamId);
    });
});
