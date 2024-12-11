import { mockItemData, mockReceivingData } from '../mockData';

export const getMockItemNumbers = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockItemData.map(item => ({
        item_number: item.item_number,
        description: item.description
      })));
    }, 500);
  });
};

export const getMockReceivingNumbers = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockReceivingData.map(receiving => ({
        receiving_no: receiving.receiving_no
      })));
    }, 500);
  });
};

// Update Form520B.js to use mock data
import { getMockItemNumbers, getMockReceivingNumbers } from '../../api/mockApi';

// In your useEffect:
useEffect(() => {
  const fetchOptions = async () => {
    try {
      const [itemResponse, receivingResponse] = await Promise.all([
        getMockItemNumbers(),
        getMockReceivingNumbers()
      ]);
      setItemOptions(itemResponse);
      setReceivingOptions(receivingResponse);
    } catch (error) {
      console.error("Error fetching options:", error);
      toast.error("Error loading data");
    }
  };
  fetchOptions();
}, []);

// Update handleGeneratePDF:
const handleGeneratePDF = (e) => {
  e.preventDefault();
  // Mock PDF generation
  toast.success("PDF generated successfully!");
  console.log("Form Data:", formData);
};