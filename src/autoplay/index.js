
import { checkAnRun, enterRoom, bindViewCtrl } from '../common';

$(async () => {
    await checkAnRun();
    $('#changeUrl').click(async () => {
        if ($('#videoUrl').val()) {
            $('#externerVideo')[0].src = $('#videoUrl').val();
            $('#externerVideo')[0].play();
        }

    })
    zg.off('roomStreamUpdate')

    zg.on('roomStreamUpdate', async (roomID, updateType, streamList, extendedData) => {
        console.warn('roomStreamUpdate 1 roomID ', roomID, streamList, extendedData);
        // let queue = []
        $("#roomState").innerText = updateType
        if (updateType == 'ADD') {
            for (let i = 0; i < streamList.length; i++) {
                console.info(streamList[i].streamID + ' was added');
                let remoteStream;

                zg.startPlayingStream(streamList[i].streamID).then(stream => {
                    remoteStream = stream;
                    useLocalStreamList.push(streamList[i]);


                    if (zg.getVersion() >= "2.17.0") {
                        const id = streamList[i].streamID
                        $(".remoteVideo").append(
                            $(`
                            <div class="view-wrapper" id="wrap${id}" style="display:inline-block;width: 240px; border: 1px solid #dfdfdf; font-size: 12px;">
                              <div id="${id}"  style="min-width: 240px;width: 240px; height: 180px;"></div>
                              <div id="local-action">
                                <button id="local-ctrl-audio${id}">开关声音</button>
                                <button id="local-ctrl-video${id}">开关视频</button>
                                <button id="local-ctrl-resume${id}">恢复</button>
                                <button id="local-ctrl-play${id}">挂载</button>
                                <button id="local-ctrl-stop${id}">卸载</button>
                                <input id="local-ctrl-volume${id}" type="range" min="0" max="100" value="100" id="audioVolume1">
                                <span id="local-ctrl-audio-state${id}"></span>
                                <span id="local-ctrl-video-state${id}"></span>
                              </div>
                            </div>`
                            )
                        );
                        const viewer = zg.createRemoteStreamView(stream);
                        viewer.on("autoplayFailed", ()=>{
                            console.error('autoplayFailed 视图组件自动播放失败',);
                        })
                        bindViewCtrl(viewer, id);
                        console.warn('enable-dialog', $("#enable-dialog").val() != "0");
                        viewer.play(id, { enableAutoplayDialog: $("#enable-dialog").val() == "1" });



                        let videoTemp = $(`<video width="100%" height="100%" controls id=${streamList[i].streamID} x-webkit-airplay="allow" webkit-playsinline="" playsinline="" x5-video-player-type="h5-page" x5-video-orientation="portrait" preload="metadata" controlslist="nofullscreen nodownload noremote footbar" oncontextmenu="return false;" autoplay=""></video>`)
                        //queue.push(videoTemp)
                        $('.remoteVideo').append(videoTemp);
                        const video = $('.remoteVideo video:last')[0];
                        console.warn('video', video, remoteStream);
                        video.srcObject = remoteStream;
                        video.muted = false;
                        const play = function () {
                            video.play()
                            document.removeEventListener("touchstart", play, false);
                        };
                        video.play()
                        document.addEventListener("WeixinJSBridgeReady", function () {
                            console.error('WeixinJSBridgeReady',);
                            play();
                        }, false);
                        document.addEventListener("touchstart", play, false);
                    } else {

                        let videoTemp = $(`<video width="100%" height="100%" id=${streamList[i].streamID} x-webkit-airplay="allow" webkit-playsinline="" playsinline="" x5-video-player-type="h5-page" x5-video-orientation="portrait" preload="metadata" controlslist="nofullscreen nodownload noremote footbar" oncontextmenu="return false;" autoplay=""></video>`)
                        //queue.push(videoTemp)
                        $('.remoteVideo').append(videoTemp);
                        const video = $('.remoteVideo video:last')[0];
                        console.warn('video', video, remoteStream);
                        video.srcObject = remoteStream;
                        video.muted = false;
                    }

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

                        console.info(useLocalStreamList[k].streamID + ' was removed');
                        if (zg.getVersion() >= "2.17.0") {
                            const a = document.querySelector(`#wrap${useLocalStreamList[k].streamID}`)

                            $(`#wrap${useLocalStreamList[k].streamID}`).remove();
                        } else {
                            $('.remoteVideo video:eq(' + k + ')').remove();
                        }
                        useLocalStreamList.splice(k--, 1);
                        break;
                    }
                }
            }
        }
    });
    $("#roomId").val(322)
    enterRoom()


});
