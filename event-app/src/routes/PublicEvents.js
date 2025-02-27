import * as React from 'react';

import EventList from '../components/EventList';

class PublicEvents extends React.Component {
    render() {
        return (
            <div className='Content'>
                <h1 className='PageTitle'>
                    Events
                </h1>
                <EventList/>
            </div>
        );
    }
}

export default PublicEvents;