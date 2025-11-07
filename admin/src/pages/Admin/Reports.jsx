import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const [timeFilter, setTimeFilter] = React.useState('monthly');
  const [dateRange, setDateRange] = React.useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    end: new Date()
  });
  const [exportRange, setExportRange] = React.useState({
    start: new Date(),
    end: new Date()
  });
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [reportData, setReportData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Fetch report data when export range changes
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await generateReportData(exportRange.start, exportRange.end);
        setReportData(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch report data. Please try again.');
        console.error('Error:', err);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [exportRange.start, exportRange.end]);

  // Function to fetch and generate report data
  const generateReportData = async (startDate, endDate) => {
    try {
      console.log('Fetching reservations for date range:', { startDate, endDate });
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/reservation/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('API Response:', data);
      const { reservations } = data;

      // Filter reservations by date range and paid status
      console.log('Total reservations before filtering:', reservations.length);
      if (!Array.isArray(reservations)) {
        console.error('Reservations is not an array:', reservations);
        throw new Error('Invalid reservations data received from server');
      }

      const filteredReservations = reservations.filter(reservation => {
        try {
          // Convert the date strings to Date objects for comparison
          const reservationDate = new Date(reservation.date);
          const startOfDay = new Date(startDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          const isInDateRange = reservationDate >= startOfDay && reservationDate <= endOfDay;
          // Consider both 'Paid' and 'Completed' as valid statuses
          const isPaid = reservation.paymentStatus === 'Paid' || reservation.status === 'Completed';
          
          console.log('Processing reservation:', {
            id: reservation._id,
            date: reservation.date,
            parsedDate: reservationDate,
            startDate: startOfDay,
            endDate: endOfDay,
            isInDateRange,
            isPaid,
            status: reservation.status,
            paymentStatus: reservation.paymentStatus
          });
          
          return isInDateRange && isPaid;
        } catch (error) {
          console.error('Error processing reservation:', reservation, error);
          return false;
        }
      });
      console.log('Filtered reservations:', filteredReservations);

      // Format the data for the report - include all fields from ManageReservation
      const formattedData = filteredReservations.map(reservation => ({
        _id: reservation._id,
        userName: reservation.userName,
        facilityName: reservation.facilityName,
        date: new Date(reservation.date).toLocaleDateString(),
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        packageName: reservation.packageName,
        packageFee: reservation.packageFee,
        totalPrice: reservation.totalPrice,
        status: reservation.status,
        paymentStatus: reservation.paymentStatus,
        paymentReference: reservation.paymentReference,
        paymentType: reservation.paymentType,
        handledBy: reservation.handledBy,
        datePaid: reservation.datePaid,
        dateCancelled: reservation.dateCancelled
      }));

      const totalSales = formattedData.reduce((sum, item) => sum + item.totalPrice, 0);
      const totalReservations = formattedData.length;

      return {
        sales: formattedData,
        totalSales,
        totalReservations
      };
    } catch (error) {
      console.error('Error fetching reservation data:', error);
      setError(error.message || 'Failed to fetch reservation data');
      return {
        sales: [],
        totalSales: 0,
        totalReservations: 0
      };
    }
  };

  // Function to download CSV
  const exportToCSV = async () => {
    const data = await generateReportData(exportRange.start, exportRange.end);
    
    // Generate the CSV content with matching ManageReservation fields
    const csvRows = [
      ['GOODWILL GIANT SPORT TOWN SALE REPORT'],
      ['Report Period:', exportRange.start.toLocaleDateString(), 'to', exportRange.end.toLocaleDateString()],
      [''],
      ['Transaction ID', 'User', 'Facility', 'Date', 'Time', 'Package', 'Fee/Hour', 'Total Fee', 'Status', 'Payment Status', 'Payment Ref.', 'Handled By', 'Date Paid/Cancelled'],
      ...data.sales.map(reservation => [
        reservation._id,
        reservation.userName,
        reservation.facilityName,
        reservation.date,
        `${reservation.startTime} - ${reservation.endTime}`,
        reservation.packageName,
        reservation.packageFee,
        reservation.totalPrice,
        reservation.status,
        reservation.paymentStatus,
        reservation.paymentReference || (reservation.paymentType === 'Cash' ? 'Cash' : '—'),
        reservation.handledBy || '—',
        reservation.datePaid || reservation.dateCancelled || '—'
      ]),
      [''],
      ['Summary'],
      ['Total Sales:', `₱${data.totalSales.toFixed(2)}`],
      ['Total Reservations:', data.totalReservations]
    ];

    // Convert rows to CSV format
    const csvContent = csvRows.map(row => 
      row.map(cell => {
        // Handle cells that need quotes (contain commas, quotes, or newlines)
        if (cell && cell.toString().includes(',')) {
          return `"${cell.toString().replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Goodwill_Giant_Sport_Town_Sale_Report_${
      exportRange.start.toLocaleDateString().replace(/\//g, '-')
    }_to_${
      exportRange.end.toLocaleDateString().replace(/\//g, '-')
    }.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  // Function to get labels based on filter
  const getFilteredLabels = () => {
    const labels = [];
    const current = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    while (current <= end) {
      switch (timeFilter) {
        case 'daily':
          labels.push(current.toLocaleDateString());
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          labels.push(`Week ${Math.ceil(current.getDate() / 7)} - ${current.toLocaleDateString('default', { month: 'short' })}`);
          current.setDate(current.getDate() + 7);
          break;
        case 'monthly':
          labels.push(current.toLocaleDateString('default', { month: 'long', year: 'numeric' }));
          current.setMonth(current.getMonth() + 1);
          break;
        case 'yearly':
          labels.push(current.getFullYear().toString());
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }
    return labels;
  };

  // Sample data generator based on filter
  const generateSampleData = (labels) => {
    return labels.map(() => Math.floor(Math.random() * 50000) + 10000);
  };

  const generateReservationData = (labels) => {
    return labels.map(() => Math.floor(Math.random() * 100) + 20);
  };

  const filteredLabels = getFilteredLabels();
  
  // Sample data - replace with actual data from your backend
  const salesData = {
    labels: filteredLabels,
    datasets: [
      {
        label: `${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Sales`,
        data: generateSampleData(filteredLabels),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const reservationsData = {
    labels: filteredLabels,
    datasets: [
      {
        label: `${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Reservations`,
        data: generateReservationData(filteredLabels),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₱' + value.toLocaleString();
          }
        }
      }
    }
  };

  const reservationOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Reservations Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Export Report
          </button>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          
          {/* Date Range Filter - can be expanded based on the filter type */}
          <select
            value={dateRange.end.getFullYear()}
            onChange={(e) => {
              const year = parseInt(e.target.value);
              setDateRange(prev => ({
                start: new Date(year, 0, 1),
                end: new Date(year, 11, 31)
              }));
            }}
            className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Graph */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Sales Report</h2>
          <div className="h-[400px] relative">
            <Line options={options} data={salesData} />
          </div>
          <div className="mt-4">
            <p className="text-gray-600">
              Total Sales: ₱{salesData.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Reservations Graph */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Reservations Report</h2>
          <div className="h-[400px] relative">
            <Bar options={reservationOptions} data={reservationsData} />
          </div>
          <div className="mt-4">
            <p className="text-gray-600">
              Total Reservations: {reservationsData.datasets[0].data.reduce((a, b) => a + b, 0)}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Monthly Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Average Monthly Sales</p>
              <p className="text-xl font-semibold text-blue-600">
                ₱{(salesData.datasets[0].data.reduce((a, b) => a + b, 0) / salesData.labels.length).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Average Reservations</p>
              <p className="text-xl font-semibold text-green-600">
                {Math.round(reservationsData.datasets[0].data.reduce((a, b) => a + b, 0) / reservationsData.labels.length)}
              </p>
            </div>
          </div>
        </div>

        {/* Facility Usage Report */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Facility Usage Report</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Gym</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">85% utilization</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Swimming Pool</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">72% utilization</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Tennis Court</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">65% utilization</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-semibold mb-4">Export Sale Report</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <DatePicker
                  selected={exportRange.start}
                  onChange={date => setExportRange(prev => ({ ...prev, start: date }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dateFormat="MM/dd/yyyy"
                  maxDate={exportRange.end}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <DatePicker
                  selected={exportRange.end}
                  onChange={date => setExportRange(prev => ({ ...prev, end: date }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dateFormat="MM/dd/yyyy"
                  minDate={exportRange.start}
                  maxDate={new Date()}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={isLoading}
                  className={`px-4 py-2 text-white rounded-lg ${
                    isLoading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? 'Exporting...' : 'Export'}
                </button>
                {error && (
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;