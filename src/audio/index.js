import { checkAnRun, enterRoom, publish, zg, useLocalStreamList } from '../common';

$(async () => {
    await checkAnRun();
    zg.off('roomStreamUpdate');
    zg.on('roomStreamUpdate', async (roomID, updateType, streamList, extendedData) => {
        console.log('roomStreamUpdate roomID ', roomID, streamList, extendedData);
        if (updateType == 'ADD') {
            for (let i = 0; i < streamList.length; i++) {
                console.info(streamList[i].streamID + ' was added');
                let remoteStream;

                try {
                    remoteStream = await zg.startPlayingStream(streamList[i].streamID, {
                        video: false,
                        audio: true
                    });
                    useLocalStreamList.push(streamList[i]);

                    $('.remoteVideo').append($(`<audio id=${streamList[i].streamID} autoplay controls muted playsinline></audio>`));
                    // $('.remoteVideo').append($(`<video id=${streamList[i].streamID + "11"} autoplay muted playsinline controls></video>`));
                    const audio = $('.remoteVideo audio:last')[0];
                    console.warn('拉流 audio', streamList[i].streamID, remoteStream);
                    audio.muted = true
                    audio.srcObject = remoteStream;
                    // 方式一：
                    audio.oncanplay = async () => {
                        try {
                            audio.muted = false;
                            await audio.play()
                        } catch (error) {
                            console.error("自动播放失败了！！！" + error)
                            // 界面提示自动播放失败，建议是弹出提示按钮，在按钮点击事件中进行恢复播放。
                        }
                    }
                    // // 方式二：
                    // audio.oncanplay = () => {
                    //     audio.muted = false;
                    //     audio.play().catch((error) => {
                    //         console.error("自动播放失败了！！！" + error)
                    //         // 界面提示自动播放失败，建议是弹出提示按钮，在按钮点击事件中进行恢复播放。
                    //     })
                    // }
                } catch (error) {
                    console.error("未知错误" + error);
                    continue;
                }

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


                        $('.remoteVideo audio:eq(' + k + ')').remove();
                        useLocalStreamList.splice(k--, 1);

                        break;
                    }
                }
            }
        }
    });

    $('#createRoom').unbind('click');
    $('#createRoom').click(async () => {
        let loginSuc = false;
        try {
            loginSuc = await enterRoom();
            loginSuc && (await publish({ camera: { video: false } }));
        } catch (error) {
            console.error(error);
        }
    });
});
