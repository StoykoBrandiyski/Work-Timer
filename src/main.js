const WARMING_MESSAGE = "Are you sure ?";
const INITIAL_TIMER_FORMAT = "00:00:00";

function createHtmlElement (element,value = "") {
    let el = document.createElement(element);
    el.innerText = value;

    return el;
}

function getFormatTimerString(seconds) {
    let hrs = Math.floor(seconds / 3600);
    let mins = Math.floor((seconds - (hrs * 3600)) / 60);
    let secs = seconds % 60;

    if (secs < 10) secs = '0' + secs;
    if (mins < 10) mins = '0' + mins;
    if (hrs < 10) hrs = '0' + hrs;

    return `${hrs}:${mins}:${secs}`;
}

function createTaskDomElement(task,time,description) {
    const tasksDiv = document.querySelector('.daily-spend-items .task-items');
    const newDiv = createHtmlElement("div");
    newDiv.classList.add("task");
    newDiv.appendChild(createHtmlElement("span",task.project))
    newDiv.appendChild(createHtmlElement("span",time))    
    if (description != '') {
        newDiv.appendChild(createHtmlElement("span",description));
    }
    tasksDiv.appendChild(newDiv);

    return tasksDiv;
}

function millisecondsToHMS(milliseconds) {
    // Calculate hours, minutes, and seconds
    var hours = Math.floor(milliseconds / 3600000); // 1 hour = 3600000 milliseconds
    var minutes = Math.floor((milliseconds % 3600000) / 60000); // 1 minute = 60000 milliseconds
    var seconds = Math.floor((milliseconds % 60000) / 1000); // 1 second = 1000 milliseconds

    // Format the result as "hours:minutes:seconds"
    var formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    return formattedTime;
}

function getFormatDateString(date) {
    let hrs = date.getHours();
    let mins = date.getMinutes();
    let secs = date.getSeconds();

    if (secs < 10) secs = '0' + secs;
    if (mins < 10) mins = '0' + mins;
    if (hrs < 10) hrs = '0' + hrs;

    return `${hrs}:${mins}:${secs}`;
}

function getAllDailyWorks() {
    var container = document.querySelectorAll('.task-items .task');

    let tasks = [];
    container.forEach(element => {
        let descriptionValue = "";

        if (container.length === 3) {
            description = element.children[2].textContent;
        }

		task.sort();
        tasks.push({
            project:  element.children[0].textContent,
            time: element.children[1].textContent,
            description: descriptionValue
        })
    });

    console.log(JSON.stringify(tasks));
}

function getCurrentDate() {
    return new Date();
}

function sortProjectNameInSelect() {
    let selectContainer = document.getElementById('subscription');
    let options = [...document.querySelectorAll('#subscription option')];


    options.sort((a, b) => a.innerText > b.innerText ? 1 : -1)
            .forEach(node => selectContainer.appendChild(node));
}

function WorkTimerViewModel() {
    var self = this;
    self.currentWorks = ko.observableArray([]);
    self.totalTimeSeconds = ko.observable(0);
    self.timeFormatString = ko.observable(INITIAL_TIMER_FORMAT);

    sortProjectNameInSelect();
    self.projectName = ko.observable("");

    self.setWork = function () {
        if (self.projectName() === ""){
            return;
        }
        self.currentWorks.push({
            project: self.projectName(),
            time: getFormatDateString(getCurrentDate())
        })
    }

    self.removeItem = function (index) {
        self.currentWorks.splice(index(),1);
    }

    self.addWorkInDailySpendItems = function (taskIndex,time,description) {
        let task = self.currentWorks()[taskIndex];

        if (task == undefined) {
            return;
        }

        createTaskDomElement(task,time,description);

        self.currentWorks.splice(taskIndex,1);
        self.calcTotalTime(time);
    }

    self.saveTasks = function () {
        let isStop = confirm(WARMING_MESSAGE);

        if (!isStop) {
            return;
        }

        let tasks = getAllDailyWorks();

        console.log(tasks);
    }

    self.calcTotalTime = function (timeString) {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        
        let taskTotalSeconds = hours * 3600 + minutes * 60 + seconds;

        let currentTotalSeconds = self.totalTimeSeconds();
        self.totalTimeSeconds(currentTotalSeconds + taskTotalSeconds);

        self.timeFormatString(getFormatTimerString(self.totalTimeSeconds()));
    }
}

ko.components.register("task", {
    template:
        `<div class="task">
        <span id="project-title" data-bind="text: projectName"></span>
        <input type="text" id="task-decription" name="task-description" placeholder="Add description">
        <div class="watch">
            <div class="time" data-bind="text: timeFormat">
            </div>
            <div class="controls">
                <button id="start" data-bind="click: start, visible: !isWorkTimer()">Start</button>
                <button id="stop"  data-bind="click: pause, visible: isWorkTimer">Pause</button>
                <button id="reset" data-bind="click: stop, visible: isWorkTimer">Stop</button>
            </div>
            <button data-bind="click: remove">X</button>
        </div>
    </div>`,
    viewModel: function (params) {
        var self = this;
        self.isWorkTimer = ko.observable(false);

        self.projectName = ko.observable(params.project);
        self.starTime = ko.observable(getCurrentDate());
        self.timeFormat = ko.observable(getFormatDateString(getCurrentDate()));
        self.startPause = getCurrentDate();
        self.description = ko.observable("");
        self.isPauseActive = false;

        self.start = function () {
            if (self.isWorkTimer()) {
                return;
            }
            
            if (self.isPauseActive) {
                var timeDifference = getCurrentDate() - self.startPause;
                self.starTime(new Date(self.starTime().getTime() + timeDifference));
    
                self.timeFormat(getFormatDateString(self.starTime()));
                self.isWorkTimer(true);
            } else {
                self.isWorkTimer(true);
                self.starTime(getCurrentDate());
                self.timeFormat(getFormatDateString(self.starTime()));
            }
        }

        self.pause = function () {
            self.isWorkTimer(false);
            self.startPause = getCurrentDate();
            self.isPauseActive = true;
        }

        self.stop = function (data,event) {
            let isStop = confirm(WARMING_MESSAGE);

            if (!isStop) {
                return;
            }
            let watch = event.target.parentNode.parentNode;
            self.description(watch.parentElement.childNodes[3].value);

            let totalTimeTask = getCurrentDate() - self.starTime();
            params.complete(params.itemIndex(),millisecondsToHMS(totalTimeTask), self.description());

            self.pause();
            self.isWorkTimer(false);
        }

        self.remove = function() {
            params.action(params.itemIndex);
        }
    }
})

const knockoutApp = document.querySelector("#knockout-app");
ko.applyBindings(new WorkTimerViewModel(), knockoutApp);