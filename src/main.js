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

function getAllDailyWorks() {
    var container = document.querySelectorAll('.task-items .task');

    let tasks = [];
    container.forEach(element => {
        let descriptionValue = "";

        if (container.length === 3) {
            description = element.children[2].textContent;
        }

        tasks.push({
            project:  element.children[0].textContent,
            time: element.children[1].textContent,
            description: descriptionValue
        })
    });

    console.log(JSON.stringify(tasks));
}

function WorkTimerViewModel() {
    var self = this;
    self.currentWorks = ko.observableArray([]);
    self.totalTimeSeconds = ko.observable(0);
    self.timeFormatString = ko.observable(INITIAL_TIMER_FORMAT);

    self.projectName = ko.observable("");

    self.setWork = function () {
        if (self.projectName() === ""){
            return;
        }
        self.currentWorks.push({
            project: self.projectName(),
            time: INITIAL_TIMER_FORMAT
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
            <div class="time" data-bind="text: time">
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

        let seconds = 0;
        let interval = null;

        self.projectName = ko.observable(params.project);
        self.time = ko.observable(INITIAL_TIMER_FORMAT);
        self.description = ko.observable("");

        self.timer = function () {
            seconds++;
            self.time(getFormatTimerString(seconds));
        }

        self.start = function () {
            if (interval) {
                return;
            }
            self.isWorkTimer(true);
            interval = setInterval(self.timer, 1000);
        }

        self.pause = function () {
            clearInterval(interval);
            interval = null;
            self.isWorkTimer(false);
        }

        self.stop = function (data,event) {
            let isStop = confirm(WARMING_MESSAGE);

            if (!isStop) {
                return;
            }
            let watch = event.target.parentNode.parentNode;
            self.description(watch.parentElement.childNodes[3].value);

            params.complete(params.itemIndex(),self.time(), self.description());

            self.pause();
            seconds = 0;
            self.isWorkTimer(false);
            self.time(INITIAL_TIMER_FORMAT);
        }

        self.remove = function() {
            params.action(params.itemIndex);
        }
    }
})

const knockoutApp = document.querySelector("#knockout-app");
ko.applyBindings(new WorkTimerViewModel(), knockoutApp);