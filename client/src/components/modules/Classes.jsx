import React, { useEffect, useState } from "react";

const Classes = () => {
    const [haveSearched, setHaveSearched] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [subjectID, setSubjectID] = useState(null);

    useEffect(() => {
        if (!subjectID){
            return;
        }

        fetch(`https://fireroad-dev.mit.edu/courses/lookup/${subjectID}?full=true`)
        .then((response) => {
            if (response.ok) { return response.json(); }
            else {throw new Error(`cannot retrieve class: response ${response.status}`)}
        })
        .then((classInfo) => {
            if (!classInfo['schedule']) {
                console.log(`Found ${subjectID}, but no schedule`);
                setSchedules([]);
                return;
            }
            const scheduleStr = classInfo['schedule'];
            parseSchdule(scheduleStr);
        }).catch((e) => {
            setSchedules(undefined);
            console.log(`NOT FOUND for ${subjectID}`);
        });
    }, [subjectID]);

    function parseSchdule(scheduleStr) {
        const blocks = scheduleStr.split(';');
        const timeBlockRe = /(?<room>[\w-]+)\/(?<days>[\w-]+)\/(?<timeType>\d)\/(?<time>[\w-]+)/;
        const roomRe = /(?<building>\d+)-(?<room>\d+)/;

        const newSchedules = []

        blocks.forEach((block) => {
            const allTime = block.split(',');
            const sectionType = allTime[0];
            for (const timeBlock of allTime.slice(1)) {
                const schedule = timeBlockRe.exec(timeBlock).groups;
                const building = roomRe.exec(schedule.room).groups.building;
                
                newSchedules.push({
                    type: sectionType, 
                    building: building,
                    room: schedule.room, 
                    days: schedule.days,
                    time: schedule.time,
                });
            }
        })

        setSchedules(newSchedules);
    }

    function displaySchedule() {
        if (!haveSearched){
            return '';
        }

        if (schedules === undefined) {
            return 'Cannot find class';
        } else if (schedules.length === undefined) {
            return 'ERROR';
        } else if (schedules.length === 0) {
            return 'No Classes this semester';
        } else {
            return schedules.map((sectionInfo) => {
                let bgColor = 'bg-gray-100';
                switch(sectionInfo.type) {
                    case "Lecture":
                        bgColor = 'bg-green-200';
                        break;
                    case "Recitation":
                        bgColor = 'bg-blue-200';
                        break;
                    case "Lab":
                        bgColor = 'bg-purple-200';
                        break;
                    case "Design":
                        bgColor = 'bg-pink-200';
                        break;
                }
                return <li>
                    <div className={`font-bold ${bgColor}`}>{sectionInfo.type}</div>
                    {sectionInfo.room}<br />
                    Meets on {sectionInfo.days} at {sectionInfo.time}<br />
                </li>;
                }
            );
        }
    }

    function handleSubjectIDQuery (e) {
        e.preventDefault(); // https://react.dev/reference/react-dom/components/input#reading-the-input-values-when-submitting-a-form
        setHaveSearched(true);
        const form = e.target;
        const formData = new FormData(form);
        setSubjectID(formData.get('subjectId'));
    }

    return <div className="overflow-scroll overscroll-contain">
        <p className="text-base">
            <form onSubmit = {handleSubjectIDQuery} className="w-100%">
                <input type= "text" name="subjectId" className="bg-gray-200"/>
                <button type="submit"> Search </button>
            </form>
        </p>
        <p className="text-base">{subjectID}</p>
        <ul>
       { displaySchedule() }
       </ul>
    </div>;
};

export default Classes;