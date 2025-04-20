import React, { useEffect, useState } from "react";

const Classes = () => {
    const [classInfo, setClassInfo] = useState('');
    const [schedules, setSchedules] = useState([]);
    const [subjectID, setSubjectID] = useState(null);

    useEffect(() => {
        // TODO Change to product API when done.
        fetch(`https://fireroad-dev.mit.edu/courses/lookup/${subjectID}?full=true
`).then((response) => response.json()).then((classInfo) => {
            console.log('HERE');
            console.log(classInfo);
            const scheduleStr = classInfo['schedule'];
            console.log(scheduleStr);
            parseSchdule(scheduleStr);
            setClassInfo(`${parseSchdule(scheduleStr)}`);
        }).catch(() => {console.log(`NOT FOUND for ${subjectId}`)});
    }, [subjectID]);

    function parseSchdule(scheduleStr) {
        const blocks = scheduleStr.split(';');
        const timeBlockRe = /(?<room>[\w-]+)\/(?<days>[\w-]+)\/(?<timeType>\d)\/(?<time>[\w-]+)/;
        const roomRe = /(?<building>\d+)-(?<room>\d+)/;

        const newSchedules = []

        console.log(blocks.length);
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

    function handleSubjectIDQuery (e) {
        e.preventDefault(); // https://react.dev/reference/react-dom/components/input#reading-the-input-values-when-submitting-a-form
        const form = e.target;
        const formData = new FormData(form);
        setSubjectID(formData.get('subjectId'));
    }

    return <div className="overflow-y-scroll overscroll-contain">
        <p className="text-base">
            Search for: 
            <form onSubmit = {handleSubjectIDQuery}>
                <input type= "text" name="subjectId" onInput={handleSubjectIDQuery}/>
                <button type="submit"> Submit </button>
            </form>
        </p>
        <p className="text-base">{subjectID}</p>
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