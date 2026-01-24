import React, { useEffect, useState } from 'react';
import { fetchCropCalendar, fetchDiseaseAlerts, type CropCalendarEvent, type DiseaseAlert } from '../services/insights';
import { AlertTriangle, Calendar } from 'lucide-react';

interface Props {
    locationName: string;
}

export const InsightsDashboard: React.FC<Props> = ({ locationName }) => {
    const [calendar, setCalendar] = useState<CropCalendarEvent[]>([]);
    const [alerts, setAlerts] = useState<DiseaseAlert[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!locationName) return;

        const load = async () => {
            setLoading(true);
            const _alerts = fetchDiseaseAlerts(locationName);
            setAlerts(_alerts);

            const _calendar = await fetchCropCalendar(locationName);
            setCalendar(_calendar);
            setLoading(false);
        };

        load();
    }, [locationName]);

    if (!locationName) return null;

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Disease Alerts Ticker */}
            {alerts.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 overflow-hidden relative">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                        <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Community Alerts</span>
                    </div>
                    <div className="space-y-2">
                        {alerts.map(alert => (
                            <div key={alert.id} className="flex items-center justify-between text-xs bg-white/50 p-2 rounded-lg">
                                <span className="font-semibold text-gray-800">{alert.disease}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${alert.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {alert.severity} Risk
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="text-[10px] text-red-400 mt-1 text-right">
                        Reported in {locationName}
                    </div>
                </div>
            )}

            {/* Crop Calendar */}
            <div className="bg-green-50/50 border border-green-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-green-700" />
                    <span className="text-xs font-bold text-green-800 uppercase tracking-wider">Seasonal Planner</span>
                </div>

                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-white/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-200">
                        {calendar.map((event, idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded-lg border border-green-50 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm text-green-900">{event.crop}</h4>
                                    <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full font-medium">
                                        {event.stage}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                    <span className="font-medium text-green-700">{event.timing}</span>
                                    <span>•</span>
                                    <span>{event.notes}</span>
                                </div>
                            </div>
                        ))}
                        {calendar.length === 0 && !loading && (
                            <div className="text-xs text-gray-500 text-center py-4">
                                No seasonal data available.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
