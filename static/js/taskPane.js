function Task(taskType) {
    var template = document.getElementById(taskType + 'Task-template').innerHTML;
    this.template = Handlebars.compile(template);
    this.taskName = taskType;
    this._data = {};
    this.step = 'info';
}

Task.prototype = {

    render: function() {
        if (!this.container) return;
        var html = this.template(this._data);
        this.container.innerHTML = html;
    },

    attach: function(containerId) {
        this.container = document.getElementById(containerId);
    },

    clearData: function() {
        this._data = {};
        this.render();
    },

    setData: function(obj) {
        for (var k in obj) {
            if (!obj.hasOwnProperty(k)) return; //nohax
            this._data[k] = obj[k];
        }
        this.render();
    },

    setStep: function(stepName) {
        this.render();
        this.step = stepName;
        this._data.step = stepName;
        var active = this.container.getElementsByClassName('active-step')[0];
        if (active) {
            active.classList.remove('active-step');
        }
        var current = this.container.getElementsByClassName('step-' + stepName)[0];
        if (current) {
            current.classList.add('active-step');
        } else {
            throw("Step for task "+this.taskName+" not found ("+stepName+")");
        }
    }

};

function TaskController() {
    this._tasks = {};
    var templates = document.querySelectorAll('script[id$=Task-template]');
    for (var t in templates) {
        var el = templates[t].id;
        if (!el) continue;
        var name = el.match(/^(.*?)Task-template/)[1];
        this.addTaskType(name);
    }
}

TaskController.prototype = {

    addTaskType: function(name) {
        this._tasks[name] = new Task(name);
        return this;
    },

    setTask: function(name, data, step) {
        this.currentTask = this._tasks[name];
        this.currentTask.setData(data);
        if (data) {
            this.currentTask.setData(data);
        }
        this.currentTask.attach('TaskPane');
        return this;
    },

    setData: function(data) {
        this.currentTask.setData(data);
        return this;
    },

    setStep: function(step) {
        this.currentTask.setStep(step);
        return this;
    }
};

