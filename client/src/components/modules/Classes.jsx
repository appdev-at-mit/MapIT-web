import React, { useEffect, useState } from "react";

const Classes = () => {
    const [classInfo, setClassInfo] = useState('');

    useEffect(() => {
        fetch("https://fireroad-dev.mit.edu/courses/lookup/6.1200").then((response) => response.json()).then((classInfo) => {
            console.log('HERE');
            console.log(classInfo);
            setClassInfo(classInfo['schedule']);
        });
    });

    return <p className="text-sm">
       {classInfo}
    </p>;
};

export default Classes;