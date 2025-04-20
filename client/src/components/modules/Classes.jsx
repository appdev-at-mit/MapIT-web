import React, { useEffect, useState } from "react";

const Classes = () => {
    const [classInfo, setClassInfo] = useState('');
    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        fetch("https://fireroad-dev.mit.edu/courses/lookup/6.1200").then((response) => response.json()).then((classInfo) => {
            console.log('HERE');
            console.log(classInfo);
            const scheduleStr = classInfo['schedule'];
            parseSchdule(scheduleStr);
            setClassInfo(`${parseSchdule(scheduleStr)}`);
        });
    });

    function parseSchdule(scheduleStr) {
        const blocks = scheduleStr.split(';');
        const re = /(?<section>\w+),(?<room>[\w-]+)\/(?<days>[\w-]+)\/(?<timeType>\d)\/(?<time>[\w-]+)/;
        const roomRe = /(?<building>\d+)-(?<room>\d+)/;

        blocks.forEach((block) => {
            // console.log(block);
            // console.log(re.exec(block));
            const schedule = re.exec(block).groups;
            const building = roomRe.exec(schedule.room).groups.building;
            // console.log(schedule.room);
            schedules.push({
                type: schedule.section, 
                building: building,
                room: schedule.room, 
                days: schedule.days,
                time: schedule.time,
            });
        })

        setSchedules(schedules);
    }

    return <div>
        <p className="text-base">{6.1200}</p>         {/* TODO: change to variable */}
        <ul>
       {schedules.map((sectionInfo) => 
        <li>
            <div className="font-bold">{sectionInfo.type}</div>
            {sectionInfo.room}<br />
            Meets on {sectionInfo.days} at {sectionInfo.time}<br />
        </li>
       )}
       </ul>
    </div>;
};

export default Classes;