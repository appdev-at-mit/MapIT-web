import React, { useEffect, useState } from "react";

const Classes = () => {
    const [haveSearched, setHaveSearched] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [subjectID, setSubjectID] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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

        const style = "text-base pt-2 pb-2"
        const header = <p className={style}>Subject Found: {subjectID}</p>

        if (schedules === undefined) {
            return <div className={style}>
                { 'Cannot find class' }
            </div>;
        } else if (schedules.length === undefined) {
            return <div className={style}>
                { 'ERROR' }
            </div>;
        } else if (schedules.length === 0) {
            return <div>
                {header}
                { 'No Classes this semester' }
            </div>;
        } else {
            const list = schedules.map((sectionInfo) => {
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
                return <li className="border rounded mt-2 mb-2">
                    <div className={`font-bold ${bgColor} pl-2`}>{sectionInfo.type}</div>
                    <p className="p-1">{sectionInfo.room}<br />
                    Meets on {sectionInfo.days} at {sectionInfo.time}<br />
                    </p>
                </li>;
                }
            );
            return <ul>{list}</ul>
        }
    }

    function handleSubjectIDQuery (e) {
        e.preventDefault(); // https://react.dev/reference/react-dom/components/input#reading-the-input-values-when-submitting-a-form
        setHaveSearched(true);
        const form = e.target;
        const formData = new FormData(form);
        setSubjectID(formData.get('subjectId'));
    }

    return <div>
        <p className="text-base flex">
            <form onSubmit = {handleSubjectIDQuery} className="w-full">
                <input type= "text" name="subjectId" className="p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                <button type="submit" className="h-full border rounded"> Search </button>
            </form>
        </p>
        <div className="overflow-scroll">
            { displaySchedule() }
       </div>
    </div>;
};

export default Classes;