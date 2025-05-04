import React, { useEffect, useState } from "react";
import { get } from "../../utilities";

const Classes = ({ onSectionSelect }) => {
    const [haveSearched, setHaveSearched] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [subjectID, setSubjectID] = useState(null);
    const [room, setRoom] = useState(null);
    const [loadDone, setLoadDone] = useState(true);

    useEffect(() => {
        if (!subjectID){
            return;
        }
        if (!subjectID.match(/^\d{1,2}\.\d{1,4}/)) {
            return;
        }
        get(`/api/class`, {subjectId: subjectID})
        .then((res) => {
            const schedule = res.schedule;
            parseSchedule(schedule);
        }).catch((e) => {
            setSchedules(undefined);
            setLoadDone(true);
            console.log(e);
            console.log(`NOT FOUND for ${subjectID}`);
        });
    }, [subjectID]);

    useEffect(() => {
        if (room === null || room === undefined) {
            return;
        }

        const searchQuery = `${room.building}-${room.roomNumber}`;

        get(`/api/rooms/search/${encodeURIComponent(searchQuery)}`)
        .then((result) => {
            onSectionSelect(result);
        })
        .catch((e) => {
            console.error('Search failed');
        });

    }, [room]);

    function parseSchedule(scheduleStr) {
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
                const roomNumber = roomRe.exec(schedule.room).groups.room;
                
                newSchedules.push({
                    type: sectionType, 
                    building: building,
                    roomNumber: roomNumber, 
                    days: schedule.days,
                    time: schedule.time,
                });
            }
        })

        setSchedules(newSchedules);
        setLoadDone(true);
    }

    function displaySchedule() {
        if (!haveSearched){
            return '';
        }

        const style = "text-base pt-2 pb-2"
        const header = <p className={style}>Subject Found: {subjectID}</p>

        if (!loadDone) {
            return <div className={style}>
                { 'Loading...' }
            </div>;
        }

        if (schedules === undefined) {
            return <div className={style}>
                { 'Cannot find class' }
            </div>;
        } else if (schedules.length === 0) {
            return <div>
                {header}
                { 'No Classes this semester' }
            </div>;
        } else if (schedules.length > 0) {
            const list = schedules.map((sectionInfo) => {
                let bgColor = 'bg-gray-100';
                switch(sectionInfo.type) {
                    case "Lecture":
                        bgColor = 'bg-appdev-green';
                        break;
                    case "Recitation":
                        bgColor = 'bg-appdev-blue';
                        break;
                    case "Lab":
                        bgColor = 'bg-appdev-purple';
                        break;
                    case "Design":
                        bgColor = 'bg-appdev-teal';
                        break;
                }
                return (
                        <button onClick={() => setRoom(sectionInfo)} className="text-left w-full border border-gray-300 rounded mt-2 mb-2 block hover:bg-gray-200">
                            <div className={`text-white ${bgColor} pl-2 rounded-t-sm`}>{sectionInfo.type}</div>
                            <p className="p-1">
                                {sectionInfo.building ? `${sectionInfo.building} - ` : ""} {sectionInfo.roomNumber}
                            <br />
                            Meets every {sectionInfo.days} at {sectionInfo.time}<br />
                            </p>
                        </button>
                    );
                }
            );
            return <div className="">{list}</div>;
        } else {
            console.error('Something went wrong.');
            return <div className={style}>
                { '' }
            </div>;
        } 
    }

    function handleSubjectIDQuery (e) {
        // Prevent URL from changing
        // https://react.dev/reference/react-dom/components/input#reading-the-input-values-when-submitting-a-form
        setLoadDone(false);
        setHaveSearched(true);
        const newSubjectID = e.target.value.trim().toUpperCase();
        setSubjectID(newSubjectID);
    }

    return <div className="contents">
        <input
            type="text"
            name="subjectId"
            onChange={handleSubjectIDQuery}
            className="p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full mt-3"
            placeholder="Search subject (e.g., 18.02)"
        />
        <div className="border-t pt-2 mt-2 flex-grow overflow-y-auto space-y-2">
          <p className="text-xs text-gray-600 mb-1">Result:</p>
          { displaySchedule() }
        </div>
    </div>;
};

export default Classes;