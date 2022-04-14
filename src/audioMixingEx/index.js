import { checkAnRun, zg, publishStreamId, logout, getEffectPlayer, logouted, stopPublish, startPreview, startPublish, getPreviewStream } from '../common';

$(async () => {
    let isMixingAudio = false;
    let isMixingBuffer = false;
    let effectId = $("#effectId").val()
    const audioEffectList = [
        {
            effectId: '1',
            path: 'https://zego-public.oss-cn-shanghai.aliyuncs.com/webplatform/websdk/station.mp3',
        },
        {
            effectId: '2',
            path: 'https://zego-public.oss-cn-shanghai.aliyuncs.com/webplatform/websdk/oldman.mp4',
        },
        {
            effectId: '3',
            path: 'https://zego-public.oss-cn-shanghai.aliyuncs.com/webplatform/websdk/bike.mp3',
        }
    ];
    await checkAnRun();
    $('#startPreview').on("click", () => {
        startPreview()
    })
    $('#startPublish').on("click", () => {
        startPublish()
    })
    $("#stopPublish").on("click", () => {
        stopPublish()
    })

    $('#MixAudio').click(() => {
        const result = zg.startMixingAudio(getPreviewStream(), [
            $('#extenerVideo1')[0],
            $('#extenerVideo2')[0],
        ]);
        console.warn('混音', result);
    });

    $('#stopMixAudio').click(() => {
        zg.stopMixingAudio(getPreviewStream());
    });

    $('#volume1').on('input', () => {
        // @ts-ignore
        zg.setMixingAudioVolume(getPreviewStream(), parseInt($('#volume1').val()), $(
            '#extenerVideo1',
        )[0]);
    });

    $('#volume2').on('input', () => {
        // @ts-ignore
        zg.setMixingAudioVolume(getPreviewStream(), parseInt($('#volume2').val()), $(
            '#extenerVideo2',
        )[0]);
    });

    $('#mixingBuffer').click(function () {
        const xhr = new XMLHttpRequest();

        xhr.open('GET', 'https://zego-public.oss-cn-shanghai.aliyuncs.com/webplatform/websdk/oldman.mp4', true);
        xhr.setRequestHeader("Range", "none")
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
            if (xhr.status == 200 || xhr.status == 304) {
                const buffer = xhr.response;
                zg.zegoWebRTC.mixingBuffer(publishStreamId, effectId, buffer, (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        isMixingBuffer = true;
                        console.warn('real time effect success');
                    }
                });
            } else {
                debugger
            }
        };

        xhr.send();
    });

    $('#stopMixingBuffer').click(function () {
        zg.zegoWebRTC.stopMixingBuffer(publishStreamId, effectId);
    });

    $('#leaveMixRoom').click(function () {
        console.warn('leave')
        // isMixingAudio && zg.stopMixingAudio(publishStreamId);
        // isMixingBuffer && zg.zegoWebRTC.stopMixingBuffer(publishStreamId, '1');
        isMixingAudio = false;
        isMixingBuffer = false;
        logout();
    });

    $('#preloadEffect').click(async () => {
        await Promise.all(audioEffectList.map(async effect => {
            const res = await zg.loadAudioEffect(effect.effectId, effect.path)
            console.warn('preload success ' + res);
            return res
        }))

        $('#playEffect')[0].disabled = false;

        $('#unloadEffect')[0].disabled = false;
    });
    $('#playEffectWithPath').click(() => {
        if (!effectId) {
            alert("需要指定播放音效id")
        }

        if (!getEffectPlayer()) alert("预览之前不支持调用")
        const id = effectId
        getEffectPlayer().start(
            id,
            { path: $("#musicPath").val() },
            () => {
                isMixingAudio = true;

                $('#pauseEffect')[0].disabled = false;

                $('#resumeEffect')[0].disabled = false;

                $('#stopEffect')[0].disabled = false;
                $("#unloadEffect")[0].disabled = false
                console.warn('start play');
            },
            () => {
                isMixingAudio = false;
                if (!logouted) {
                    alert("音效播放结束 " + id)
                }
                console.warn('play end' + id);
            },
        );
    });
    $('#playEffect').click(() => {
        if (!effectId) {
            alert("需要指定播放音效id")
        }
        if (!getEffectPlayer()) alert("预览之前不支持调用")
        const id = effectId
        getEffectPlayer().start(
            id,
            undefined,
            () => {
                isMixingAudio = true;

                $('#pauseEffect')[0].disabled = false;

                $('#resumeEffect')[0].disabled = false;

                $('#stopEffect')[0].disabled = false;
                console.warn('start play');
            },
            () => {
                isMixingAudio = false;
                console.warn('play end' + id, logouted);
                if (!logouted) {
                    alert("音效播放结束 " + id)
                }
                // $('#pauseEffect')[0].disabled = true;

                // $('#resumeEffect')[0].disabled = true;

                // $('#stopEffect')[0].disabled = true;
            },
        );
    });

    $('#pauseEffect').click(() => {
        if (!getEffectPlayer()) alert("预览之前不支持调用")
        getEffectPlayer().pause(effectId || undefined);
    });

    $('#resumeEffect').click(() => {
        if (!getEffectPlayer()) alert("预览之前不支持调用")
        getEffectPlayer().resume(effectId || undefined);
    });

    $('#stopEffect').click(() => {
        if (!getEffectPlayer()) alert("预览之前不支持调用")
        getEffectPlayer().stop(effectId || undefined);
        if (!effectId) {

            // $('#pauseEffect')[0].disabled = true;

            // $('#resumeEffect')[0].disabled = true;

            // $('#stopEffect')[0].disabled = true;
        }
    });
    $("#seekTo").click(() => {
        if (!effectId) {
            alert("no effectId")
        }
        if (!getEffectPlayer()) alert("预览之前不支持调用")
        const total = getEffectPlayer().getTotalDuration(effectId)
        const origin = getEffectPlayer().getCurrentProgress(effectId)
        const progress = (($("#progress").val() || 0) / 100) * total

        getEffectPlayer().seekTo(effectId, progress);
        alert(`总时长：${total},指定位置：${progress}, 原位置：${origin}`)
    });

    $('#unloadEffect').click(() => {
        let num = 0;
        audioEffectList.forEach(effect => {
            zg.zegoWebRTC.unloadEffect(effect.effectId) && num++;
        });
        effectId && zg.zegoWebRTC.unloadEffect(effectId)

        if (num === audioEffectList.length) {
            console.warn('all unload success');

            $('#playEffect')[0].disabled = true;

            $('#unloadEffect')[0].disabled = true;
        }
    });
    $("#effectId").change(() => {
        effectId = $("#effectId").val()
    })
});
