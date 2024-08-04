
// 음성 인식 객체 초기화
let recognition;
let selectedRole = '';
let selectedRoleMessage = '';
let roles = {};
let silenceTimeout;  // 침묵 타이머 변수
let isRecording = false;  // 음성 인식 상태

// 음성 인식 설정
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ko-KR';

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('user-input').value = transcript;
        stopRecording();
    };

    recognition.onerror = function(event) {
        console.error(event.error);
        stopRecording();
    };

    recognition.onend = function() {
        clearTimeout(silenceTimeout);  // 음성 인식 종료 시 타이머 초기화
        if (isRecording) toggleRecording();  // 음성 인식이 끝나면 버튼 상태를 업데이트
        document.getElementById('visualizer').style.display = 'none';  // 음성 인식 시각적 표시 숨김
    };

    recognition.onspeechstart = function() {
        clearTimeout(silenceTimeout);  // 음성 감지 시 타이머 초기화
        document.getElementById('visualizer').style.display = 'block';  // 음성 인식 시각적 표시
    };

    recognition.onspeechend = function() {
        silenceTimeout = setTimeout(stopRecording, 5000);  // 5초 동안 침묵 시 음성 인식 중지
    };
}

// 음성 입력 토글
function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// 음성 입력 시작
function startRecording() {
    if (recognition) {
        recognition.start();
        isRecording = true;
        document.getElementById('toggle-record-btn').textContent = "음성 입력 중지";
        document.getElementById('visualizer').style.display = 'block';  // 음성 인식 시각적 표시
    }
}

// 음성 입력 중지
function stopRecording() {
    if (recognition) {
        recognition.stop();
        isRecording = false;
        document.getElementById('toggle-record-btn').textContent = "음성 입력 시작";
        document.getElementById('visualizer').style.display = 'none';  // 음성 인식 시각적 표시 숨김
    }
}

// 역할 선택 함수 수정
function selectRole(role, message) {
    selectedRole = role;
    selectedRoleMessage = message;

    let roleInKorean;

    // 역할 이름을 한국어로 변환
    switch (role) {
        case 'grammar-checker':
            roleInKorean = '맞춤법 검사기';
            break;
        case 'self-help-author':
            roleInKorean = '자기계발서 작가';
            break;
        case 'novelist':
            roleInKorean = '소설작가';
            break;
        case 'it-blogger':
            roleInKorean = 'IT 전문 블로거';
            break;
        case 'translator':
            roleInKorean = '번역기';
            break;
        default:
            roleInKorean = role;  // 기본적으로 영어 이름 사용
    }

    if (!roles[role]) {
        roles[role] = message;
        const displayMessage = `안녕하세요 ${roleInKorean} 입니다. ${message} 무엇을 도와드릴까요?`;
        appendMessage(displayMessage, 'assistant-message');
    }
}

// 메시지 추가 함수 수정 - 타이핑 효과 추가
function appendMessage(content, className) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${className}`;
    const chatBox = document.getElementById('chat-box');
    chatBox.appendChild(messageElement);

    let index = 0;
    function typeWriter() {
        if (index < content.length) {
            messageElement.innerHTML += content.charAt(index);
            index++;
            setTimeout(typeWriter, 50); // 속도 조절
        }
    }
    typeWriter();

    chatBox.scrollTop = chatBox.scrollHeight;
}

// 엔터키 핸들링
function handleKeyDown(event) {
    if (event.key === 'Enter') {
        if (event.altKey || event.ctrlKey) {
            const userInput = document.getElementById('user-input');
            userInput.value += '\n';  // Alt+Enter 또는 Ctrl+Enter로 줄바꿈 추가
        } else {
            sendRequest();  // 그냥 엔터로 메시지 전송
        }
        event.preventDefault();  // 기본 엔터 동작 방지
    }
}

// 요청 보내기
async function sendRequest() {
    const userInput = document.getElementById("user-input").value;

    if (!userInput.trim()) return;

    appendMessage(userInput, 'user-message');

    let systemMessage;
    if (selectedRole === "grammar-checker") {
        systemMessage = {"role": "system", "content": "당신은 맞춤법 검사기입니다. 제공된 텍스트의 문법 오류를 수정하세요."};
    } else if (selectedRole === "self-help-author") {
        systemMessage = {"role": "system", "content": "당신은 유명한 자기계발서 작가입니다. 제공된 텍스트를 기반으로 동기 부여와 영감을 주는 조언을 제공하세요."};
    } else if (selectedRole === "novelist") {
        systemMessage = {"role": "system", "content": "당신은 소설작가입니다. 제공된 텍스트를 기반으로 흥미로운 이야기를 만들어보세요."};
    } else if (selectedRole === "it-blogger") {
        systemMessage = {"role": "system", "content": "당신은 IT 전문 블로거입니다. 주어진 주제에 대해 상세하고 통찰력 있는 내용을 제공하세요."};
    } else if (selectedRole === "translator") {
        systemMessage = {"role": "system", "content": "당신은 번역기입니다. 제공된 텍스트를 지정된 언어로 번역하세요."};
    }

    const response = await fetch("https://open-api.jejucodingcamp.workers.dev/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify([systemMessage, {"role": "user", "content": userInput}])
    });

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
    appendMessage(assistantMessage, 'assistant-message');

    document.getElementById("user-input").value = '';
}
