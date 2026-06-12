import React from 'react'
import TeacherMyClasscomponent from '../../components/Teacher/Teacher.MyClass.component'
import TeacherMySubjectscomponent from '../../components/Teacher/Teacher.MySubjects.component'
import TeacherStudentcomponent from '../../components/Teacher/Teacher.Student.component'


const TeacherClassManagement = () => {
  return (
    <div>
      <TeacherMyClasscomponent />
      <TeacherMySubjectscomponent />
      <TeacherStudentcomponent />
    </div>
  )
}

export default TeacherClassManagement